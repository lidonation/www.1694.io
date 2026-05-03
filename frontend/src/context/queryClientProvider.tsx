'use client';
import { QueryClient, QueryClientProvider } from 'react-query';

interface Props {
  children: React.ReactNode;
}

const client = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});
function QueryProvider(props: Props) {
  return (
    <QueryClientProvider client={client}>{props.children}</QueryClientProvider>
  );
}
export default QueryProvider;
