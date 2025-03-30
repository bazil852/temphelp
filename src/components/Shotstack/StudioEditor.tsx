import { useEffect } from 'react';
import { useShotstack } from './ShotstackContext';

interface StudioEditorProps {
  owner: string;
  interactive: boolean;
  timeline: boolean;
  sidepanel: boolean;
  controls: boolean;
  settings: boolean;
  style?: any;
  template: any;
  onUpdateEvent?: (e: any) => void;
  onMetadataEvent?: (e: any) => void;
}

const StudioEditor = ({
  owner,
  interactive,
  timeline,
  sidepanel,
  controls,
  settings,
  style,
  template,
  onUpdateEvent,
  onMetadataEvent,
}: StudioEditorProps) => {
  const shotstack = useShotstack();

  useEffect(() => {
    if (!shotstack) return;

    const options = {
      owner,
      interactive,
      timeline,
      sidepanel,
      controls,
      settings,
      style,
      disableTracking: true,
    };

    shotstack.create('studio-sdk-editor', template, options);

    if (onUpdateEvent) shotstack.on?.('update', onUpdateEvent);
    if (onMetadataEvent) shotstack.on?.('metadata', onMetadataEvent);

    return () => {
      if (onUpdateEvent) shotstack.off?.('update', onUpdateEvent);
      if (onMetadataEvent) shotstack.off?.('metadata', onMetadataEvent);
    };
  }, [shotstack, template]);

  return <div id="studio-sdk-editor" style={{ width: '100%', height: '600px' }} />;
};

export default StudioEditor;
