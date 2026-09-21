import { ITimeProvider } from "../../domain/ports/ITimeProvider";

export class SystemTimeProvider implements ITimeProvider {
    getCurrentTime(): Date {
        return new Date();
    }
}
