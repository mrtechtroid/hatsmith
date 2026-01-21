import { useState } from "react";
import { makeStyles } from "@mui/styles";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { Button, Hidden } from "@mui/material";
import { Alert } from "@mui/material";
import { checkLocale } from "../../locales";
import { getTranslations as t } from "../../locales";
import locales from "../../locales/locales";

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
    padding: 0,
  },
}));

const Language = () => {
  const classes = useStyles();

  const [language, setLanguage] = useState(checkLocale());

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    if (localStorage) {
      localStorage.setItem("language", e.target.value);
    }
    window.location.reload(true);
  };

  return (
    <>
      <FormControl varient="outlined" className={classes.formControl} sx={{
          '& .MuiOutlinedInput-root': {
            height: '40px', // Adjust this to your desired height
            padding: '5px'
          }
          }}>
        <InputLabel>{t("language")}</InputLabel>
        <Select
          value={language}
          onChange={handleLanguageChange}
          label={t("language")}
        >
          {Object.entries(locales).map(([code, name]) => (
            <MenuItem key={code} value={code}>
              {name.language_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
};

export default Language;
