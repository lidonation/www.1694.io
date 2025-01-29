import axiosInstance from "../axiosInstance";

export type NodeStatusResponse = {
    hash: string;
    epoch_no: number;
    slot_no: string;
    epoch_slot_no: number;
    block_no: number;
    previous_id: string;
    slot_leader: string;
    size: number;
    time: string;
    tx_count: string;
    proto_major: number;
    proto_minor: number;
    vrf_key: string;
    op_cert: string;
    op_cert_counter: string;
    behindBy: number;
}
export const getCurrentNodeStatus = async () => {
    const response = await axiosInstance.get(`/misc/node/status`);
    return response.data as NodeStatusResponse;
}