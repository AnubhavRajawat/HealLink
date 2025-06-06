import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  useTheme,
  Tooltip,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  AppBar,
  Toolbar
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { motion } from 'framer-motion';
import { getHealthAdvice } from '../utils/gemini';
import { translateToHindi } from '../utils/translate';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '../theme';
import Switch from '@mui/material/Switch';

const AIResponse = ({ toggleTheme, mode }) => {
  const location = useLocation();
  const { question, language } = location.state || {};

  const theme = mode === 'light' ? lightTheme : darkTheme;
  const [assessment, setAssessment] = useState(null);
  const [translated, setTranslated] = useState(null);
  const [error, setError] = useState(null);
  const [selectedLang, setSelectedLang] = useState(language || 'English');
  const [isTranslating, setIsTranslating] = useState(false);

  const translations = {
    en: {
      healthAssessment: 'Health Assessment',
      suggestedIssue: 'Suggested Health Issue:',
      urgencyLevel: 'Urgency Level:',
      actionableAdvice: 'Actionable Advice',
      consultDoctor: 'Please consider consulting a healthcare professional.',
      talkToDoctor: 'Talk to a Doctor',
      backToHome: 'Back to Home',
      consultSpecialist: (specialty) => specialty ? `Please consider consulting a ${specialty}.`:''
    },
    hi: {
      healthAssessment: 'हेल्थ अस्सेसमेंट',
      suggestedIssue: 'संभावित समस्या:',
      urgencyLevel: 'गंभीरता स्तर:',
      actionableAdvice: 'सलाह:',
      consultDoctor: 'कृपया किसी डॉक्टर से सलाह लें।',
      talkToDoctor: 'डॉक्टर से बात करें',
      backToHome: 'मुखपृष्ठ पर वापस जाएं',
      consultSpecialist: (specialty) => specialty ? `कृपया एक ${specialty} से परामर्श करने पर विचार करें।`: ''
    }
  };
  
  const isHindi = selectedLang === 'Hindi';

  useEffect(() => {
    async function fetchAdvice() {
      if (!question) return;

      try {
        setError(null);
        const result = await getHealthAdvice(question);
        setAssessment(result);

        if (isHindi && !translated) {
          await handleTranslation(result);
        }
      } catch (err) {
        console.error('Error getting health advice:', err);
        setError('Sorry, we encountered an error while generating health advice. Please try again later.');
      }
    }

    fetchAdvice();
  }, [question]);

  const handleTranslation = async (data = assessment) => {
    try {
      setIsTranslating(true);
      const translatedIssue = await translateToHindi(data.issue);
      const translatedAdvice = await translateToHindi(data.advice);

      setTranslated({
        issue: translatedIssue,
        advice: translatedAdvice,
        urgency: data.urgency,
        shouldSeeDoctor: data.shouldSeeDoctor,
      });
    } catch (err) {
      console.error('Translation failed:', err);
      setError('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleLanguageChange = async (_, newLang) => {
    if (!newLang) return;
    setSelectedLang(newLang);

    if (newLang === 'Hindi' && !translated) {
      await handleTranslation();
    }
  };

  const display = isHindi && translated ? translated : assessment;

  if (!assessment && !error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Analyzing your health concern...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box>
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', p: 1 }}>
                HeaLink<span style={{ color: '#1976D2' }}>AI</span>
              </Typography>
            </Box>
            <Tooltip title="Toggle Dark/Light Theme">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                <LightModeIcon sx={{ color: theme.palette.mode === 'light' ? '#FFA500' : 'grey.500' }} />
                <Switch onChange={toggleTheme} checked={theme.palette.mode === 'dark'} />
                <DarkModeIcon sx={{ color: theme.palette.mode === 'dark' ? '#90CAF9' : 'grey.500' }} />
              </Box>
            </Tooltip>
          </Toolbar>
        </AppBar>
        <Box sx={{ maxWidth: 800, mx: 'auto', backgroundColor: 'background.default', color: 'text.primary', p: 2 }}>
          {/* Language Toggle */}
          <ToggleButtonGroup
            value={selectedLang}
            exclusive
            onChange={handleLanguageChange}
            sx={{ mb: 3 }}
          >
            <ToggleButton value="English">English</ToggleButton>
            <ToggleButton value="Hindi">हिन्दी</ToggleButton>
          </ToggleButtonGroup>

          {/* Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card elevation={3} sx={{ borderRadius: 4, p: 2 }}>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  {isHindi ? translations.hi.healthAssessment : translations.en.healthAssessment}
                </Typography>

                <Typography variant="h6">
                  {isHindi ? translations.hi.suggestedIssue : translations.en.suggestedIssue} {display.issue}
                </Typography>

                <Typography
                  variant="subtitle1"
                  sx={{ color: display.urgency === 'High' ? 'error.main' : 'text.secondary', mb: 2 }}
                >
                  {isHindi ? translations.hi.urgencyLevel : translations.en.urgencyLevel} {display.urgency}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6">
                  {isHindi ? 'सलाह:' : 'Actionable Advice'}
                </Typography>

                <Typography variant="body1" sx={{ mt: 1 }}>
                  {display.advice}
                </Typography>

                  {typeof display.shouldSeeDoctor === 'string' && display.shouldSeeDoctor.length > 0 ? (
                  <Typography sx={{ mt: 2, color: 'error.main', fontWeight: 'bold' }}>
                    {isHindi
                      ? translations.hi.consultSpecialist(display.shouldSeeDoctor)
                      : translations.en.consultSpecialist(display.shouldSeeDoctor)}
                  </Typography>
                ) : display.shouldSeeDoctor ?(
                   <Typography sx={{ mt: 2, color: 'error.main', fontWeight: 'bold' }}>
                    {isHindi ? translations.hi.consultDoctor : translations.en.consultDoctor} </Typography> ):(
                  <Typography sx={{ mt: 2, color: 'green.main', fontWeight: 'bold' }}>
                    {isHindi ? 'चिंता न करें , आपको डॉक्टर से मिलने की ज़रूरत नहीं है।' : 'You may not need to see a doctor.'}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button variant="contained" href="/remote-doctor">
              {isHindi ? translations.hi.talkToDoctor : translations.en.talkToDoctor}
            </Button>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button variant="outlined" href="/">
              {isHindi ? translations.hi.backToHome : translations.en.backToHome}
            </Button>
          </Box>

          <Typography variant="body2" textAlign="center" sx={{ mt: 4, color: 'text.secondary' }}>
            Powered by HealLink AI
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default AIResponse;
