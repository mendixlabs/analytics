# Mendix Analytics Widget

## Main Analytics

This widget is the main analytics widget - It does all the communication to mendix.

It currently does :

- **User Data**: That contain data like:

```
    didUserReload: boolean;
    userAgent: string;
    platform: string;
    language: string;
    startedDate: Date;
    userIDMX: string;
    isGuestMX: string;
```

- **Event Listener**: Listens to Widget Analytics Class Widget for Events: Pubsub token: `CLASSNAME_MENDIX_LISTENER`
- **Timer Listener**: Listens to Widget Analytics Form Widget for Events: Pubsub token: `TIMER_MENDIX_LISTENER`

## Event Analytics

Dispatches Events via PUB_SUB to Main analytics Widget

### Setup Event

<img src='./assets/eventSetup.png' width=500/>

### Implementation Event

<img src='./assets/eventImp.png' width=500/>

## Inspiration

https://engineering.linkedin.com/blog/2017/02/measuring-and-optimizing-performance-of-single-page-applications
