import { Component, type ReactNode } from 'react';
import { NText } from 'nayan-ui/components';

export default class PreviewBoundary extends Component<{ onError: (error: Error) => void; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    return this.state.error ? (
      <NText tag="p" className="m-auto max-w-md p-6 text-center text-sm text-danger">{this.state.error.message}</NText>
    ) : this.props.children;
  }
}
