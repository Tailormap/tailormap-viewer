import { UserResponseModel } from './user-response.model';

export interface ExtendedUserResponseModel extends UserResponseModel {
  isHttpError?: boolean;
}
