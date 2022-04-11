import { ReactElement, createElement } from "react";
import { HelloWorldSample } from "./components/HelloWorldSample";
import { AnalyticsFormPreviewProps } from "../typings/AnalyticsFormProps";

export function preview({ sampleText }: AnalyticsFormPreviewProps): ReactElement {
    return <HelloWorldSample sampleText={sampleText} />;
}

export function getPreviewCss(): string {
    return require("./ui/AnalyticsForm.css");
}
