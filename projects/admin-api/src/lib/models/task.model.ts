export interface TaskModel {
  /** The unique identifier of the task */
  uuid: string | null;
  /** Type of the task. */
  type: string;
  /** Description of the task. */
  description: string;
}
