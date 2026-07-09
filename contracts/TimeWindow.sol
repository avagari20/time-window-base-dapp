// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TimeWindow {
    uint256 public nextWindowId = 1;

    struct Window {
        address holder;
        string label;
        string hour;
        string note;
        uint256 createdAt;
    }

    mapping(uint256 => Window) private windows;

    event WindowClaimed(
        uint256 indexed windowId,
        address indexed holder,
        string label,
        string hour,
        string note
    );

    function claimWindow(
        string calldata label,
        string calldata hour,
        string calldata note
    ) external returns (uint256 windowId) {
        require(bytes(label).length > 0 && bytes(label).length <= 40, "Invalid label");
        require(bytes(hour).length > 0 && bytes(hour).length <= 18, "Invalid hour");
        require(bytes(note).length > 0 && bytes(note).length <= 120, "Invalid note");

        windowId = nextWindowId++;
        windows[windowId] = Window({
            holder: msg.sender,
            label: label,
            hour: hour,
            note: note,
            createdAt: block.timestamp
        });

        emit WindowClaimed(windowId, msg.sender, label, hour, note);
    }

    function getWindow(
        uint256 windowId
    )
        external
        view
        returns (
            address holder,
            string memory label,
            string memory hour,
            string memory note,
            uint256 createdAt
        )
    {
        Window storage entry = windows[windowId];
        return (
            entry.holder,
            entry.label,
            entry.hour,
            entry.note,
            entry.createdAt
        );
    }
}
