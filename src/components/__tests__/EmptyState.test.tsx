import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('should render with message', () => {
    const message = 'Brak danych do wyświetlenia';
    
    render(<EmptyState message={message} />);
    
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('should display calendar icon', () => {
    render(<EmptyState message="Test message" />);
    
    // Check that SVG is rendered
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should have proper styling classes', () => {
    const { container } = render(<EmptyState message="Test" />);
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('flex', 'flex-col', 'items-center');
  });
});

