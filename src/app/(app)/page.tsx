import {HomeScreen, homeMockData} from "@/widgets/home-screen";

export default function HomePage() {
    return (
        <div className="-mx-4 -mt-6">
            <HomeScreen {...homeMockData}/>
        </div>
    );
}
