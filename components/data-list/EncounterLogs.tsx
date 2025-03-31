import { Typography } from '@mui/material';
import { EncounterLog } from '@/types/Encounter';

const EncounterLogs = (props: { logs: EncounterLog[] }) => {


  return <>
    {props.logs.map((log: EncounterLog) => (<Typography key={log.id}>{log.content}</Typography>))}
  </>;
};
export default EncounterLogs;