import type { LoadingState } from "saga-query";

import { Loading } from "./loading";

interface LoadResourcesProps {
  query: LoadingState;
  children: React.ReactNode;
  isEmpty: boolean;
  empty?: JSX.Element;
  loader?: JSX.Element;
  error?: (e: string) => JSX.Element;
}

export const EmptyResources = () => {
  return <span>No resources found.</span>;
};

export const ErrorResources = ({ message = "" }: { message: string }) => (
  <span>Error: {message}</span>
);

export function LoadResources({
  query,
  isEmpty,
  children,
  empty = <EmptyResources />,
  loader = <Loading />,
  error = (message) => <ErrorResources message={message} />,
}: LoadResourcesProps): JSX.Element {
  const { isInitialLoading, isError, message: errorMessage } = query;
  if (isInitialLoading) {
    return loader;
  }
  if (isError && errorMessage) {
    return error(errorMessage);
  }
  if (isEmpty) {
    return empty;
  }
  return <>{children}</>;
}
