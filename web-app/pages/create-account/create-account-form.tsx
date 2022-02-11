import React, { useState, useRef } from 'react';
import {
    Box,
    Button,
    Typography,
    Step,
    Stepper,
    StepLabel,
    useTheme,
    useMediaQuery,
    styled
} from '@mui/material';
import { useSnackbar } from 'notistack';
import PersonalInfo from './personal-info';
import ProjectGoals from './project-goals';
import InviteFriends from './invite-friends';

export default function CreateAccountForm() {
    const theme = useTheme();
    const { enqueueSnackbar } = useSnackbar();
    const steps = ['Personal Information', 'Project Goals', 'Invite Friends'];
    const [activeStep, setActiveStep] = useState(0);
    const [skipped, setSkipped] = useState(new Set<number>());

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [discord, setDiscord] = useState('');
    const [occupation, setOccupation] = useState<any>(0);
    const [availabilityState, setAvailabilityState] = useState<any>(0);
    const [primaryGoal, setPrimaryGoal] = useState<any>(0);
    const [idealCollab, setIdealCollab] = useState<any>(0);

    const state = {
        firstName, setFirstName,
        lastName, setLastName,
        email, setEmail,
        discord, setDiscord,
        occupation, setOccupation,
        availabilityState, setAvailabilityState,
        primaryGoal, setPrimaryGoal,
        idealCollab, setIdealCollab
    }

    const personalInfoRef = useRef(null);

    // @ts-ignore
    const isStepOptional = (step: number) => {
        // return step === 1;
        return false;
    };

    const isStepSkipped = (step: number) => {
        return skipped.has(step);
    };

    const handleNext = () => {
        let newSkipped = skipped;
        if (isStepSkipped(activeStep)) {
            newSkipped = new Set(newSkipped.values());
            newSkipped.delete(activeStep);
        }

        let hasError = false;
        if (activeStep === 0) {
            if (!firstName) {
                enqueueSnackbar('We need your first name', {variant: 'error'});
                hasError = true;
            }
            if (!lastName) {
                enqueueSnackbar('We need your last name', {variant: 'error'});
                hasError = true;
            }
        }

        if (!hasError) {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
            setSkipped(newSkipped);
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleSkip = () => {
        if (!isStepOptional(activeStep)) {
            // You probably want to guard against something like this,
            // it should never occur unless someone's actively trying to break something.
            throw new Error("You can't skip a step that isn't optional.");
        }

        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        setSkipped((prevSkipped) => {
            const newSkipped = new Set(prevSkipped.values());
            newSkipped.add(activeStep);
            return newSkipped;
        });
    };

    const handleReset = () => {
        setActiveStep(0);
    };

    return (
        <>
            <Stepper
                activeStep={activeStep} orientation={useMediaQuery(theme.breakpoints.down('sm')) ? 'vertical' : 'horizontal'}
            >
                {steps.map((label, index) => {
                    const stepProps: { completed?: boolean } = {};
                    const labelProps: {
                        optional?: React.ReactNode;
                    } = {};
                    if (isStepOptional(index)) {
                        labelProps.optional = (
                            <Typography variant="caption">Optional</Typography>
                        );
                    }
                    if (isStepSkipped(index)) {
                        stepProps.completed = false;
                    }
                    return (
                        <Step key={label} {...stepProps}>
                            <StepLabel {...labelProps}>{label}</StepLabel>
                        </Step>
                    );
                })}
            </Stepper>
            {activeStep === steps.length ? (
                <React.Fragment>
                    <Typography sx={{ mt: 2, mb: 1 }}>
                        All steps completed - you&apos;re finished
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            pt: 2
                        }}
                    >
                        <Box sx={{ flex: '1 1 auto' }} />
                        <Button onClick={handleReset}>Reset</Button>
                    </Box>
                </React.Fragment>
            ) : (
                <React.Fragment>
                    {/* <Typography sx={{ mt: 2, mb: 1 }}>
                                        Step {activeStep + 1}
                                    </Typography> */}

                    {activeStep === 0 && <PersonalInfo state={state} />}
                    {activeStep === 1 && <ProjectGoals state={state} />}
                    {activeStep === 2 && <InviteFriends state={state} />}

                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            pt: 2
                        }}
                    >
                        <Button
                            color="inherit"
                            disabled={activeStep === 0}
                            onClick={handleBack}
                            sx={{ mr: 1 }}
                        >
                            Back
                        </Button>
                        <Box sx={{ flex: '1 1 auto' }} />
                        {isStepOptional(activeStep) && (
                            <Button
                                color="inherit"
                                onClick={handleSkip}
                                sx={{ mr: 1 }}
                            >
                                Skip
                            </Button>
                        )}
                        <Button onClick={handleNext}>
                            {activeStep === steps.length - 1
                                ? 'Finish'
                                : 'Next'}
                        </Button>
                    </Box>
                </React.Fragment>
            )}
        </>
    );
}
