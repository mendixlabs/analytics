import { ReactElement, createElement } from "react";
import { HelloWorldSample } from "./components/HelloWorldSample";
import { AnalyticsFormPreviewProps } from "../typings/AnalyticsFormProps";

export function preview({ classNameToTrack }: AnalyticsFormPreviewProps): ReactElement {
    return <HelloWorldSample sampleText={classNameToTrack} />;
}

export function getPreviewCss(): string {
    return require("./ui/AnalyticsForm.css");
}
