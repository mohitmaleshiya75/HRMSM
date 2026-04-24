import AttendanceScreen from "@/features/attendance/components/ViewAttandance";
import WorkingHoursCard from "@/features/attendance/components/workinghours/WorkingHours";
import useViewAttendance from "@/features/attendance/hooks/useViewAttendance";

export default function ViewAttandance() {
    const { attendance, isLoading, totalCount } = useViewAttendance({ showAllAttendance: true });

    return (
        <>
            <WorkingHoursCard />
            <AttendanceScreen data={{
                results: attendance,
                count: totalCount,
                next: null,
                previous: null,
            }} />
        </>)
}