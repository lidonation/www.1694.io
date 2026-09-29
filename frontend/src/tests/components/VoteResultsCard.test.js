import { render, screen } from '@testing-library/react';
import VoteResultsCard from '@/components/proposals/VoteResultsCard';

jest.mock('@/hooks/usePollVotes', () => ({
  usePollVotes: () => ({ data: undefined, isLoading: false }),
}));

describe('VoteResultsCard honest empty state (issue 227)', () => {
  test('renders no NaN/Invalid Date/undefined when poll missing', () => {
    const { container } = render(
      <VoteResultsCard poll={undefined} showFullDetails={false} />,
    );
    const text = container.textContent || '';
    expect(text).not.toMatch(/NaN/);
    expect(text).not.toMatch(/Invalid Date/);
    expect(text).not.toMatch(/undefined/);
    expect(screen.getByText(/Vote counts unavailable/i)).toBeInTheDocument();
  });

  test('renders Unknown power instead of NaN when vote powers missing', () => {
    const poll = [{ id: '1', attributes: { poll_yes: 3, poll_no: 2 } }];
    const { container } = render(
      <VoteResultsCard poll={poll} showFullDetails={false} />,
    );
    const text = container.textContent || '';
    expect(text).not.toMatch(/NaN/);
  });
});
