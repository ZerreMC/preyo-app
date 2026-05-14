type TimeUnit = Intl.RelativeTimeFormatUnit;

const THRESHOLDS: { divisor: number; unit: TimeUnit }[] = [
    {divisor: 60, unit: "second"},
    {divisor: 60, unit: "minute"},
    {divisor: 24, unit: "hour"},
    {divisor: 7, unit: "day"},
    {divisor: 4.33, unit: "week"},
    {divisor: 12, unit: "month"},
    {divisor: Infinity, unit: "year"},
];

const rtf = new Intl.RelativeTimeFormat("es", {numeric: "auto"});

export function formatRelativeTime(dateString: string): string {
    let elapsed = (new Date(dateString).getTime() - Date.now()) / 1000;

    for (const {divisor, unit} of THRESHOLDS) {
        if (Math.abs(elapsed) < divisor) {
            return rtf.format(Math.round(elapsed), unit);
        }
        elapsed /= divisor;
    }

    return rtf.format(Math.round(elapsed), "year");
}
