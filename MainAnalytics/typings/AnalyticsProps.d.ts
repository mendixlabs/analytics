/**
 * This file was generated from Analytics.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { CSSProperties } from "react";
import { ActionValue, EditableValue } from "mendix";

export interface AnalyticsContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    jsonState: EditableValue<string>;
    communicateOut: EditableValue<string>;
    sendInitialSession?: ActionValue;
    addPageViewed?: ActionValue;
    addPageLeave?: ActionValue;
    eventListenerAction?: ActionValue;
    FormListenerAction?: ActionValue;
    modalAction?: ActionValue;
}

export interface AnalyticsPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    jsonState: string;
    communicateOut: string;
    sendInitialSession: {} | null;
    addPageViewed: {} | null;
    addPageLeave: {} | null;
    eventListenerAction: {} | null;
    FormListenerAction: {} | null;
    modalAction: {} | null;
}
