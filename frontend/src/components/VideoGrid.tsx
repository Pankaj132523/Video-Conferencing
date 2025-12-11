import VideoTile from './VideoTile';

interface User {
  id: number;
  name: string;
  initials: string;
  micOn: boolean;
  video: string;
}

interface VideoGridProps {
  users: User[];
  activeSpeakerId: number;
}

const VideoGrid = ({ users = [], activeSpeakerId }: VideoGridProps) => (
  <div className="grid grid-cols-2 grid-rows-2 gap-4 w-full h-full">
    {users.map(user => (
      <VideoTile key={user.id} user={user} isActiveSpeaker={user.id === activeSpeakerId} />
    ))}
  </div>
);

export default VideoGrid;

