import { allQueus, flowProducer } from "@superstreamer/artisan/producer";
import { Job as BullMQJob } from "bullmq";
import type { JobNode, JobState, Queue } from "bullmq";
import type { Job } from "./types";

function findQueueByName(name: string): Queue {
  const queue = allQueus.find((queue) => queue.name === name);
  if (!queue) {
    throw new Error("No queue found.");
  }
  return queue;
}

function formatIdPair(id: string): [Queue, string] {
  const queueName = id.split("_", 1)[0];
  if (!queueName) {
    throw new Error("Missing queueName as prefix when formatting id pair");
  }
  return [findQueueByName(queueName), id];
}

export async function getJobs(): Promise<Job[]> {
  const result: Job[] = [];

  for (const queue of allQueus) {
    const jobs = await queue.getJobs();

    for (const job of jobs) {
      if (!job.id || job.parent) {
        continue;
      }
      result.push(await getJob(job.id, false));
    }
  }

  result.sort((a, b) => b.createdOn - a.createdOn);

  return result;
}

export async function getJob(id: string, fromRoot?: boolean): Promise<Job> {
  const node = await getJobNode(id, fromRoot);
  return await formatJobNode(node);
}

export async function getJobLogs(id: string): Promise<string[]> {
  const [queue, jobId] = formatIdPair(id);

  const { logs } = await queue.getJobLogs(jobId);

  return logs;
}

async function getJobNode(id: string, fromRoot?: boolean): Promise<JobNode> {
  const [queue, jobId] = formatIdPair(id);

  let job = await BullMQJob.fromId(queue, jobId);
  if (fromRoot) {
    // If we want the root, resolve it and work with that as our job.
    job = await findRootJob(job);
  }

  if (!job?.id) {
    throw new Error("No job found.");
  }

  return await flowProducer.getFlow({
    id: job.id,
    queueName: job.queueName,
  });
}

async function findRootJob(job?: BullMQJob): Promise<BullMQJob | undefined> {
  if (!job) {
    return;
  }

  while (job.parent) {
    const [queue, jobId] = formatIdPair(job.parent.id);
    const parentJob = await BullMQJob.fromId(queue, jobId);
    if (!parentJob) {
      throw new Error("No parent job found.");
    }
    job = parentJob;
  }

  return job;
}

async function formatJobNode(node: JobNode): Promise<Job> {
  const { job, children } = node;
  if (!job.id) {
    throw new Error("Missing job id");
  }

  let progress = 0;
  if (typeof job.progress === "number") {
    progress = job.progress;
  }

  const state = mapJobState(await job.getState());

  const failedReason = state === "failed" ? job.failedReason : undefined;

  const findParentSortIndex = (job: BullMQJob): number => {
    const value = job.data?.parentSortIndex;
    return typeof value === "number" ? value : 0;
  };
  (children ?? []).sort(
    (a, b) => findParentSortIndex(a.job) - findParentSortIndex(b.job),
  );

  const jobChildren = await Promise.all((children ?? []).map(formatJobNode));

  let processedOn = job.processedOn;
  if (processedOn) {
    for (const jobChild of jobChildren) {
      if (
        jobChild.processedOn &&
        processedOn !== undefined &&
        jobChild.processedOn < processedOn
      ) {
        processedOn = jobChild.processedOn;
      }
    }
  }

  const duration =
    state === "completed" && processedOn && job.finishedOn
      ? job.finishedOn - processedOn
      : undefined;

  let tag: string | undefined;
  const potentialTag = job.data?.metadata?.tag;
  if (typeof potentialTag === "string") {
    tag = potentialTag;
  }

  return {
    id: job.id,
    name: job.name,
    state,
    progress,
    duration,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    createdOn: job.timestamp,
    inputData: JSON.stringify(job.data),
    outputData: job.returnvalue ? JSON.stringify(job.returnvalue) : undefined,
    failedReason,
    tag,
    children: jobChildren,
  };
}

function mapJobState(jobState: JobState | "unknown"): Job["state"] {
  if (jobState === "active" || jobState === "waiting-children") {
    return "running";
  }
  if (jobState === "completed") {
    return "completed";
  }
  if (jobState === "failed") {
    return "failed";
  }
  return "waiting";
}
