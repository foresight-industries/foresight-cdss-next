import { AxiosError, isAxiosError } from 'axios';

export const getErrorMessage = (err: unknown) => {
  let message = (err as Error).message;
  if (isAxiosError(err)) {
    message = JSON.stringify((err as AxiosError)?.response?.data);
  }

  return message;
};
