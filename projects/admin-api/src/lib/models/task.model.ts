export interface TaskModel {
  /** The unique identifier of the task */
  uuid: string;
  /** Type of the task. */
  type: string;
  /** Description of the task. */
  description: string;

  lastResult?: string;
  state?: string;
}
