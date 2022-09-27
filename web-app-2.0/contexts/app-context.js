import { useMediaQuery } from '@mui/material';
import { createContext, useEffect, useState } from 'react';
import convertVapidKey from 'convert-vapid-public-key'

const availability = [
    { id: 1, text: 'Philanthropy' },
    { id: 2, text: 'Investing' },
    { id: 3, text: 'Volunteering' },
    { id: 4, text: 'Live Streaming' },
    { id: 5, text: 'Writing' },
    { id: 6, text: 'Advising' },
    { id: 7, text: 'Volunteering' },
    { id: 8, text: 'Full-time Roles' },
    { id: 9, text: 'Part-time Roles' },
    { id: 10, text: 'Open Source Contributions' },
    { id: 11, text: 'Activism' },
    { id: 12, text: 'Raising Funds' },
    { id: 13, text: 'Artist Management' },
    { id: 14, text: 'Content Creation' },
    { id: 15, text: 'Hiring' },
    { id: 16, text: 'Volunteering' },
    { id: 17, text: 'NFT Projects' },
    { id: 18, text: 'Joining DAOs' },
    { id: 19, text: 'Co-founding Companies' },
    { id: 20, text: 'Mentoring' }
]

const occupations = [
    { id: 1, text: 'Artist' },
    { id: 2, text: 'Developer' },
    { id: 3, text: 'Athlete' },
    { id: 4, text: 'Marketing & Community' },
    { id: 5, text: 'Investor' },
    { id: 6, text: 'Accountant' },
    { id: 7, text: 'Engineer' },
    { id: 8, text: 'Actor' },
    { id: 9, text: 'Video Producer' },
    { id: 10, text: 'Writer' },
    { id: 999, text: 'Other' },
]

const userGoals = [
    { id: 1, text: 'Launch an NFT project' },
    { id: 2, text: 'Collaborate in a creative project' },
    { id: 3, text: 'Find a job in a web3 company' },
    { id: 4, text: 'Work for a DAO' },
    { id: 5, text: 'Contribute to a community' },
]

const maxReputationScore = 140;

export const AppContext = createContext();

const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    if (!('PushManager' in window)) {
        return;
    }

    const registration = await navigator.serviceWorker.register('/service-workers/push-notifications.js');
    console.log('Push Notifications Service Worker Registered');
    return registration;
};

const subscribeUserToPush = async () => {
    const registration = await registerServiceWorker();
    const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: convertVapidKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
    };

    const subscription = await registration.pushManager.subscribe(subscribeOptions);
    localStorage.setItem('psn-subscription', JSON.stringify(subscription));
    return subscription;
};

export const AppProvider = ({ children }) => {
    const [mode, setMode] = useState('dark');
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    useEffect(() => {
        const cache = localStorage.getItem('color-mode');
        if (!cache) {
            localStorage.setItem('color-mode', prefersDarkMode ? 'dark' : 'light');
            setMode('dark');
        } else {
            setMode(cache);
        }

        registerServiceWorker();
    }, [mode]);

    const setDarkMode = () => {
        localStorage.setItem('color-mode', 'dark');
        setMode('dark');
    }

    const setLightMode = () => {
        localStorage.setItem('color-mode', 'light');
        setMode('light');
    }

    const getColorMode = () => {
        return mode;
    }

    const value = {
        availability,
        occupations,
        userGoals,
        setDarkMode,
        setLightMode,
        maxReputationScore,
        mode,
        registerServiceWorker,
        subscribeUserToPush,
    };
    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
