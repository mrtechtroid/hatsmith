import { currentVersion } from "../config/Constants";
import { makeStyles } from "@mui/styles";
import Chip from "@mui/material/Chip";

const useStyles = makeStyles((theme) => ({
  chip: {
    backgroundColor: theme.palette.custom.gallery.main,
    color: theme.palette.custom.mountainMist.main,
    borderRadius: ".25rem",
    padding: "none",
    marginLeft: 5,
    marginBottom: 0,
  },
}));

const VersionBadge = () => {
  const classes = useStyles();
  return (
    <Chip className={classes.chip} label={"v" + currentVersion} size="small" />
  );
};

export default VersionBadge;
