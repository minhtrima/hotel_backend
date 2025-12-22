import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { io } from "socket.io-client";
import api from "../services/api";
import { housekeepingService } from "../services/housekeepingService";
import { taskService, roomService } from "../services/api";
import { useAuth } from "./AuthContext";

// Initial state
const initialState = {
  rooms: [],
  tasks: [],
  isLoading: false,
  error: null,
  selectedRoom: null,
};

// Actions
const HOUSEKEEPING_ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
  SET_ROOMS: "SET_ROOMS",
  SET_TASKS: "SET_TASKS",
  UPDATE_ROOM: "UPDATE_ROOM",
  UPDATE_TASK: "UPDATE_TASK",
  SET_SELECTED_ROOM: "SET_SELECTED_ROOM",
};

// Reducer
const housekeepingReducer = (state, action) => {
  switch (action.type) {
    case HOUSEKEEPING_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case HOUSEKEEPING_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
    case HOUSEKEEPING_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    case HOUSEKEEPING_ACTIONS.SET_ROOMS:
      return { ...state, rooms: action.payload, isLoading: false };
    case HOUSEKEEPING_ACTIONS.SET_TASKS:
      return { ...state, tasks: action.payload, isLoading: false };
    case HOUSEKEEPING_ACTIONS.UPDATE_ROOM:
      return {
        ...state,
        rooms: state.rooms.map((room) =>
          room._id === action.payload._id
            ? { ...room, ...action.payload }
            : room
        ),
      };
    case HOUSEKEEPING_ACTIONS.UPDATE_TASK:
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task._id === action.payload._id
            ? { ...task, ...action.payload }
            : task
        ),
      };
    case HOUSEKEEPING_ACTIONS.SET_SELECTED_ROOM:
      return { ...state, selectedRoom: action.payload };
    default:
      return state;
  }
};

// Create context
const HousekeepingContext = createContext({});

// Housekeeping Provider Component
export const HousekeepingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(housekeepingReducer, initialState);
  const { user } = useAuth();
  const socketRef = useRef(null);

  // Load assigned rooms
  const loadAssignedRooms = useCallback(async () => {
    // Get staffId - handle both string and object cases
    const staffId = user?.staffId?._id || user?.staffId || user?.id;
    console.log("User object:", user);
    console.log("Extracted staffId:", staffId);

    if (!staffId) {
      console.log("No staffId found in user:", user);
      return;
    }

    try {
      dispatch({ type: HOUSEKEEPING_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: HOUSEKEEPING_ACTIONS.CLEAR_ERROR });

      console.log("Loading rooms for staffId:", staffId);
      const result = await housekeepingService.getAssignedRooms(staffId);
      dispatch({ type: HOUSEKEEPING_ACTIONS.SET_ROOMS, payload: result.rooms });
    } catch (error) {
      console.log("Error loading assigned rooms:", error);
      dispatch({
        type: HOUSEKEEPING_ACTIONS.SET_ERROR,
        payload: error.message,
      });
    }
  }, [user]);

  // Load my tasks
  const loadMyTasks = useCallback(
    async (status = null) => {
      const staffId = user?.staffId?._id || user?.staffId || user?.id;
      if (!staffId) return;

      try {
        dispatch({ type: HOUSEKEEPING_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: HOUSEKEEPING_ACTIONS.CLEAR_ERROR });

        const tasks = await taskService.getTasksByStaff(staffId);
        dispatch({ type: HOUSEKEEPING_ACTIONS.SET_TASKS, payload: tasks });
      } catch (error) {
        dispatch({
          type: HOUSEKEEPING_ACTIONS.SET_ERROR,
          payload: error.message,
        });
      }
    },
    [user]
  );

  // Start cleaning
  const startCleaning = useCallback(
    async (roomId) => {
      const staffId = user?.staffId?._id || user?.staffId || user?.id;
      if (!staffId) return;

      try {
        dispatch({ type: HOUSEKEEPING_ACTIONS.SET_LOADING, payload: true });

        const result = await housekeepingService.startCleaning(roomId, staffId);

        if (result.room) {
          dispatch({
            type: HOUSEKEEPING_ACTIONS.UPDATE_ROOM,
            payload: result.room,
          });
        }

        if (result.task) {
          dispatch({
            type: HOUSEKEEPING_ACTIONS.UPDATE_TASK,
            payload: result.task,
          });
        }

        dispatch({ type: HOUSEKEEPING_ACTIONS.SET_LOADING, payload: false });
        return { success: true };
      } catch (error) {
        dispatch({
          type: HOUSEKEEPING_ACTIONS.SET_ERROR,
          payload: error.message,
        });
        return { success: false, error: error.message };
      }
    },
    [user?.staffId]
  );

  // Complete cleaning
  const completeCleaning = useCallback(
    async (roomId, note, issues = []) => {
      const staffId = user?.staffId?._id || user?.staffId || user?.id;
      if (!staffId) return;

      try {
        dispatch({ type: HOUSEKEEPING_ACTIONS.SET_LOADING, payload: true });

        const result = await housekeepingService.completeCleaning(
          roomId,
          staffId,
          note,
          issues
        );

        if (result.room) {
          dispatch({
            type: HOUSEKEEPING_ACTIONS.UPDATE_ROOM,
            payload: result.room,
          });
        }

        if (result.task) {
          dispatch({
            type: HOUSEKEEPING_ACTIONS.UPDATE_TASK,
            payload: result.task,
          });
        }

        dispatch({ type: HOUSEKEEPING_ACTIONS.SET_LOADING, payload: false });
        return { success: true };
      } catch (error) {
        dispatch({
          type: HOUSEKEEPING_ACTIONS.SET_ERROR,
          payload: error.message,
        });
        return { success: false, error: error.message };
      }
    },
    [user]
  );

  // Update room status
  const updateRoomStatus = useCallback(async (roomId, statusData) => {
    try {
      dispatch({ type: HOUSEKEEPING_ACTIONS.SET_LOADING, payload: true });

      // Use roomService instead of housekeepingService for room updates
      const result = await roomService.updateRoomStatus(roomId, statusData);

      if (result.room) {
        dispatch({
          type: HOUSEKEEPING_ACTIONS.UPDATE_ROOM,
          payload: result.room,
        });
      }

      dispatch({ type: HOUSEKEEPING_ACTIONS.SET_LOADING, payload: false });
      return { success: true };
    } catch (error) {
      dispatch({
        type: HOUSEKEEPING_ACTIONS.SET_ERROR,
        payload: error.message,
      });
      return { success: false, error: error.message };
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: HOUSEKEEPING_ACTIONS.CLEAR_ERROR });
  }, []);

  // Set selected room
  const setSelectedRoom = useCallback((room) => {
    dispatch({ type: HOUSEKEEPING_ACTIONS.SET_SELECTED_ROOM, payload: room });
  }, []);

  // Update task status (for mobile app to update task progress)
  const updateTaskStatus = useCallback(async (taskId, status, note = null) => {
    try {
      dispatch({ type: HOUSEKEEPING_ACTIONS.SET_LOADING, payload: true });

      const result = await taskService.updateTaskStatus(taskId, status, note);

      dispatch({
        type: HOUSEKEEPING_ACTIONS.UPDATE_TASK,
        payload: result,
      });

      return { success: true, task: result };
    } catch (error) {
      dispatch({
        type: HOUSEKEEPING_ACTIONS.SET_ERROR,
        payload: error.message,
      });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: HOUSEKEEPING_ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  // Socket.io: listen to backend events to refresh data in real-time
  useEffect(() => {
    if (!user) return;

    const serverBase = api.defaults.baseURL
      ? api.defaults.baseURL.replace(/\/api\/?$/, "")
      : "";

    try {
      const socket = io(serverBase, { transports: ["websocket"] });
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("Socket connected (housekeeping):", socket.id);
      });

      const handleTasksRefresh = () => {
        loadMyTasks();
        loadAssignedRooms();
      };

      const handleRoomsUpdate = (payload) => {
        // payload may contain roomId and housekeepingStatus
        // Reload assigned rooms and tasks so UI stays in sync
        loadAssignedRooms();
        loadMyTasks();
      };

      socket.on("tasks:refresh", handleTasksRefresh);
      socket.on("rooms:housekeeping:update", handleRoomsUpdate);
      socket.on("rooms:status:update", handleRoomsUpdate);
      socket.on("tasks:created", () => {
        loadAssignedRooms();
        loadMyTasks();
      });

      return () => {
        socket.off("tasks:refresh", handleTasksRefresh);
        socket.off("rooms:housekeeping:update", handleRoomsUpdate);
        socket.off("rooms:status:update", handleRoomsUpdate);
        socket.off("tasks:created");
        socket.disconnect();
      };
    } catch (err) {
      console.warn("Socket.io init failed:", err);
    }
  }, [user, loadAssignedRooms, loadMyTasks]);

  const value = {
    ...state,
    loadAssignedRooms,
    loadMyTasks,
    startCleaning,
    completeCleaning,
    updateRoomStatus,
    updateTaskStatus,
    clearError,
    setSelectedRoom,
  };

  return (
    <HousekeepingContext.Provider value={value}>
      {children}
    </HousekeepingContext.Provider>
  );
};

// Hook to use Housekeeping Context
export const useHousekeeping = () => {
  const context = useContext(HousekeepingContext);

  if (!context) {
    throw new Error(
      "useHousekeeping must be used within a HousekeepingProvider"
    );
  }

  return context;
};

export default HousekeepingContext;
