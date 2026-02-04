import { redirect } from 'next/navigation';

export const metadata = {
  title: 'API Documentation - Yield Delta',
  description: 'Redirecting to API Reference documentation',
};

export default function APIRedirectPage() {
  redirect('/docs/api-reference');
}
