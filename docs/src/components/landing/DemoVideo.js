import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import { styled, alpha } from '@mui/material/styles';

const VideoContainer = styled('div')(({ theme }) => [
  {
    position: 'relative',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    padding: 12,
    paddingBottom: 4,
    background: `linear-gradient(120deg, ${(theme.vars || theme).palette.primary[50]} 0%, ${alpha(
      theme.palette.primary[100],
      0.2,
    )} 150%)`,
    border: '1px solid',
    borderColor: `${alpha(theme.palette.primary[100], 0.6)}`,
    boxShadow: `4px 0 40px ${alpha(theme.palette.primary[100], 0.8)}`,
    overflow: 'hidden',
    '&:hover .MuiToolpadHero-pauseButton, &:focus .MuiToolpadHero-pauseButton': {
      opacity: 1,
    },
  },
  theme.applyDarkStyles({
    background: `linear-gradient(120deg, ${alpha(theme.palette.primary[700], 0.5)} 0%, ${alpha(
      theme.palette.primary[800],
      0.4,
    )} 150%)`,
    borderColor: `${alpha(theme.palette.primary[300], 0.3)}`,
    boxShadow: `4px 0 40px ${alpha(theme.palette.primary[600], 0.5)}`,
  }),
]);

const Video = styled('video')(({ theme }) => [
  {
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    borderRadius: 10,
    border: '1px solid',
    borderColor: `${alpha(theme.palette.primary[100], 0.6)}`,
  },
  theme.applyDarkStyles({
    borderColor: `${alpha(theme.palette.primary[700], 0.5)}`,
  }),
]);

const videoMainControls = (theme) => ({
  position: 'absolute',
  transform: 'translate(-50%,-50%)',
  background: `linear-gradient(120deg, ${(theme.vars || theme).palette.primary[400]} 0%, ${
    (theme.vars || theme).palette.primary[600]
  } 150%)`,
  borderRadius: 99,
  width: 58,
  height: 58,
  inset: '50%',
  border: 'none',
  boxShadow: `0 4px 8px ${alpha(theme.palette.primary[900], 0.5)}`,
  transition: theme.transitions.create(['scale', 'box-shadow', 'opacity'], {
    duration: theme.transitions.duration.shortest,
  }),
  zIndex: 10,
  '&:hover': {
    scale: '1.02',
    background: `linear-gradient(120deg, ${(theme.vars || theme).palette.primary[500]} 0%, ${
      (theme.vars || theme).palette.primary[700]
    } 150%)`,
    boxShadow: `0 8px 16px ${alpha(theme.palette.primary[900], 0.5)}`,
  },
});

const PlayButton = styled(IconButton)(({ theme }) => [
  {
    ...videoMainControls(theme),
  },
]);

const PauseButton = styled(IconButton)(({ theme }) => [
  {
    ...videoMainControls(theme),
    opacity: 0,
  },
]);

export default function DemoVideo() {
  /** @type {React.MutableRefObject<HTMLVideoElement>} */
  const videoRef = React.useRef();
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      throw new Error('videoRef should be attached to a video');
    }

    const handlePlayEvent = () => {
      setIsPlaying(true);
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'toolpad_video', {
          event_label: 'Video Start',
          event_category: 'toolpad_landing',
        });
      }
    };

    const handlePauseEvent = () => {
      setIsPlaying(false);
    };

    video.addEventListener('play', handlePlayEvent);
    video.addEventListener('pause', handlePauseEvent);
    return () => {
      video.removeEventListener('play', handlePlayEvent);
      video.removeEventListener('pause', handlePauseEvent);
    };
  }, []);

  const handlePlay = () => {
    videoRef.current.play();
  };

  const handlePause = () => {
    videoRef.current.pause();
  };

  const milestonesComplete = React.useRef(new Set([]));

  const handleTimeUpdate = () => {
    if (typeof window === 'undefined' || !window.gtag || !videoRef.current) {
      return;
    }
    const videoElement = videoRef.current;

    const videoProgress = (videoElement.currentTime / videoElement.duration) * 100;

    const milestones = [25, 50, 75, 100];

    for (const milestone of milestones) {
      if (videoProgress >= milestone && !milestonesComplete.current.has(milestone)) {
        window.gtag('event', 'toolpad_video', {
          event_category: 'toolpad_landing',
          event_label: `video_progress_${milestone}`,
        });
        milestonesComplete.current.add(milestone);
        if (milestone === 100) {
          milestonesComplete.current.clear();
        }
      }
    }
  };

  return (
    <VideoContainer>
      {isPlaying ? (
        <PauseButton className="MuiToolpadHero-pauseButton" type="button" onClick={handlePause}>
          <PauseRoundedIcon sx={{ color: '#FFF' }} />
        </PauseButton>
      ) : (
        <PlayButton type="button" onClick={handlePlay} color="primary">
          <PlayArrowRoundedIcon sx={{ color: '#FFF' }} />
        </PlayButton>
      )}

      <Video
        poster="/static/toolpad/marketing/index-hero-video-poster-2.png"
        ref={videoRef}
        controls
        onTimeUpdate={handleTimeUpdate}
      >
        <source src="/static/toolpad/marketing/index-hero-demo-video-2.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </Video>
    </VideoContainer>
  );
}
