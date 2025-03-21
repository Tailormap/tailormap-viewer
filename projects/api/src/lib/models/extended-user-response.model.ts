import { UserResponseModel } from './user-response.model';

export interface ExtendedUserResponseModel extends UserResponseModel {
  error?: 'unauthorized' | 'other';
}
