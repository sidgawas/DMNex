import { Outlet, useParams } from "react-router-dom";
import { useWorkspaceStore } from "../features/workspace/useWorkspaceStore";
import { useEffect } from "react";


export function WorkspacesOutlet() {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { setCurrentActiveWorkspaceId } = useWorkspaceStore();

    useEffect(() => {
        if (workspaceId) {
            setCurrentActiveWorkspaceId(workspaceId);
        }
        return () => {
            setCurrentActiveWorkspaceId(null);
        }
    }, [workspaceId, setCurrentActiveWorkspaceId]);
    return (
        <Outlet>

        </Outlet>
    );
}