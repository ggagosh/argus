import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import OperationDetails from './OperationDetails';
import { ClipboardCopy, Check, AlertTriangle } from 'lucide-react';

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const originalModule = jest.requireActual('lucide-react');
  return {
    ...originalModule,
    ClipboardCopy: jest.fn(() => <svg data-testid="clipboard-copy-icon" />),
    Check: jest.fn(() => <svg data-testid="check-icon" />),
    AlertTriangle: jest.fn(() => <svg data-testid="alert-triangle-icon" />),
  };
});

// Mock ThemeAwareShikiHighlighter as it's not relevant to these tests
jest.mock('../../ui/shiki-highlighter', () => ({
  ThemeAwareShikiHighlighter: jest.fn(({ children }) => <pre>{children}</pre>),
}));


const mockOperationBase = {
  op: 'query',
  ns: 'test.collection',
  millis: 123,
  ts: new Date().toISOString(),
  formatTime: (time) => `${time}ms`,
  formatTimestamp: (ts) => new Date(ts).toLocaleString(),
};

describe('OperationDetails - Copy Query Functionality', () => {
  let originalClipboard;
  let mockConsoleError;

  beforeEach(() => {
    // Mock navigator.clipboard
    originalClipboard = navigator.clipboard;
    navigator.clipboard = { writeText: jest.fn() };
    // Spy on console.error
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Use fake timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Restore original clipboard
    navigator.clipboard = originalClipboard;
    // Restore console.error
    mockConsoleError.mockRestore();
    // Clear all timers
    jest.clearAllTimers();
    // Restore real timers
    jest.useRealTimers();
  });

  // Test 1: Button Rendering
  test('renders "Copy Query" button when query is present', () => {
    const mockOperation = {
      ...mockOperationBase,
      query: { find: 'test.collection', filter: { name: 'Test' } },
    };
    render(<OperationDetails selectedOperation={mockOperation} formatTime={mockOperation.formatTime} formatTimestamp={mockOperation.formatTimestamp} />);
    expect(screen.getByText('Copy Query')).toBeInTheDocument();
    expect(screen.getByTestId('clipboard-copy-icon')).toBeInTheDocument();
  });

  test('renders "Copy Query" button when command is present', () => {
    const mockOperation = {
      ...mockOperationBase,
      command: { aggregate: 'test.collection', pipeline: [{ $match: {} }] },
    };
    render(<OperationDetails selectedOperation={mockOperation} formatTime={mockOperation.formatTime} formatTimestamp={mockOperation.formatTimestamp} />);
    expect(screen.getByText('Copy Query')).toBeInTheDocument();
    expect(screen.getByTestId('clipboard-copy-icon')).toBeInTheDocument();
  });

  test('does not render "Copy Query" button when neither query nor command is present', () => {
    const mockOperation = { ...mockOperationBase }; // No query or command
    render(<OperationDetails selectedOperation={mockOperation} formatTime={mockOperation.formatTime} formatTimestamp={mockOperation.formatTimestamp} />);
    expect(screen.queryByText('Copy Query')).not.toBeInTheDocument();
  });
  
  test('does not render "Copy Query" button when selectedOperation is null', () => {
    render(<OperationDetails selectedOperation={null} formatTime={mockOperationBase.formatTime} formatTimestamp={mockOperationBase.formatTimestamp} />);
    expect(screen.queryByText('Copy Query')).not.toBeInTheDocument();
  });


  // Test 2: Copy Success
  test('copies query to clipboard, updates button text and icon on success', async () => {
    const mockQuery = { find: 'test.collection', filter: { name: 'Test Success' } };
    const mockOperation = {
      ...mockOperationBase,
      query: mockQuery,
    };
    navigator.clipboard.writeText.mockResolvedValueOnce(undefined);

    render(<OperationDetails selectedOperation={mockOperation} formatTime={mockOperation.formatTime} formatTimestamp={mockOperation.formatTimestamp} />);
    
    const copyButton = screen.getByText('Copy Query');
    fireEvent.click(copyButton);

    await act(async () => {
      jest.runAllTimers(); // Resolve promises and advance timers
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(JSON.stringify(mockQuery, null, 2));
    expect(screen.getByText('Copied!')).toBeInTheDocument();
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('clipboard-copy-icon')).not.toBeInTheDocument();


    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    expect(screen.getByText('Copy Query')).toBeInTheDocument();
    expect(screen.getByTestId('clipboard-copy-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
  });

  // Test 3: Copy Failure
  test('shows error state, updates button text and icon on copy failure, and logs error', async () => {
    const mockCommand = { aggregate: 'test.collection', pipeline: [{ $match: { status: 'Error' } }] };
    const mockOperation = {
      ...mockOperationBase,
      command: mockCommand,
    };
    const copyError = new Error('Test Clipboard Error');
    navigator.clipboard.writeText.mockRejectedValueOnce(copyError);

    render(<OperationDetails selectedOperation={mockOperation} formatTime={mockOperation.formatTime} formatTimestamp={mockOperation.formatTimestamp} />);
    
    const copyButton = screen.getByText('Copy Query');
    fireEvent.click(copyButton);

    await act(async () => {
      jest.runAllTimers(); // Resolve promises and advance timers
    });
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(JSON.stringify(mockCommand, null, 2));
    expect(mockConsoleError).toHaveBeenCalledWith('Failed to copy query: ', copyError);
    expect(screen.getByText('Copy Failed')).toBeInTheDocument();
    expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('clipboard-copy-icon')).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Copy Query')).toBeInTheDocument();
    expect(screen.getByTestId('clipboard-copy-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('alert-triangle-icon')).not.toBeInTheDocument();
  });
});
