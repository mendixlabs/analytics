# Main Analytics Widget

This widget is the main analytics widget - It does all the comunication to mendix.

It currently does :

-   **User Data**: That contain data like:

```
    didUserReload: boolean;
    userAgent: string;
    platform: string;
    language: string;
    startedDate: Date;
    userIDMX: string;
    isGuestMX: string;
```

-   **Event Listener**: Listens to Widget Analytics Class Widget for Events: Pubsub token: `CLASSNAME_MENDIX_LISTENER`
-   **Timer Listener**: Listens to Widget Analytics Form Widget for Events: Pubsub token: `TIMER_MENDIX_LISTENER`

## Inspiration

https://engineering.linkedin.com/blog/2017/02/measuring-and-optimizing-performance-of-single-page-applications
