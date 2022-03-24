/**
 * This file was generated from AnalyticsEvent.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { CSSProperties } from "react";

export interface ClassNameToTrackType {
    friendlyName: string;
    className: string;
    isListView: boolean;
}

export interface ClassNameToTrackPreviewType {
    friendlyName: string;
    className: string;
    isListView: boolean;
}

export interface AnalyticsEventContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    classNameToTrack: ClassNameToTrackType[];
}

export interface AnalyticsEventPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    classNameToTrack: ClassNameToTrackPreviewType[];
}
