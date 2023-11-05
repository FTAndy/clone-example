import { ObjectId } from 'mongodb'

export enum TaskStatus  {
  notStarted = 0,
  finished = 1,
  failed = 99
}

export type CarwlerTask = {
  _id: ObjectId,
  name: string,
  type: string,
  specialStatus: TaskStatus,
  AIContentStatus: TaskStatus,
  imdbID: string,
  status: TaskStatus
}

export type Special = {
  href: string,
  name: string,
  isStarred?: boolean
}