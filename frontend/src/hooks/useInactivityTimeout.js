import { useEffect, useRef } from 'react';

/**
 * Custom hook to monitor user inactivity and trigger logout after specified timeout
 * @param {Function} onTimeout - Callback function to execute when timeout occurs
 * @param {number} timeoutDuration - Timeout duration in milliseconds (default: 5 minutes)
 */
const useInactivityTimeout = (onTimeout, timeoutDuration = 5 * 60 * 1000) => {
    const timeoutRef = useRef(null);

    const resetTimer = () => {
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout
        timeoutRef.current = setTimeout(() => {
            if (onTimeout) {
                onTimeout();
            }
        }, timeoutDuration);
    };

    useEffect(() => {
        // Events that indicate user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        // Reset timer on any user activity
        const handleActivity = () => {
            resetTimer();
        };

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Initialize timer
        resetTimer();

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [onTimeout, timeoutDuration]);
};

export default useInactivityTimeout;
