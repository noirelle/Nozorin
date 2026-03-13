import { useCallActions, UseCallActionsProps } from './useCallActions';

export interface UseCallProps extends UseCallActionsProps {}

export const useCall = (props: UseCallProps = {}) => {
    const actions = useCallActions(props);

    return {
        ...actions
    };
};
