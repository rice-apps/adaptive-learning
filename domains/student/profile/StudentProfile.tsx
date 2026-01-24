import { Card, CardContent } from "@/components/ui/card";

export default function StudentProfileClient() {
    return (
        <div>
            <Card>
                <CardContent>
                    <p>Your name</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent>
                    <p>Your career interests</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent>
                    <p>Your goals</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent>
                    <p>Topics of interest</p>
                </CardContent>
            </Card>
        </div>
    );
}