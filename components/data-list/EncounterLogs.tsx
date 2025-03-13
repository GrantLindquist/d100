import { Typography } from '@mui/material';
import { EncounterLog } from '@/types/Encounter';

const EncounterLogs = (props: { logs: EncounterLog[] }) => {


  return <>
    {props.logs.map((log: EncounterLog) => (<Typography>{log.content}</Typography>))}
  </>;
};
export default EncounterLogs;