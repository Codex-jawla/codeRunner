'use client';
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import dynamic from "next/dynamic";
import { languageOptions } from "./utils/languages";
import OutputPanel from "./components/OuputPanel";
import AISuggestions from "./components/AISuggestions";
import axios from "axios";
import { Users, Copy, Check, X, UserPlus, Plus } from "lucide-react";

const MonacoEditor = dynamic(() => import("./components/Editor"));

// Judge0 Language ID mapping
const LANGUAGE_ID_MAP: { [key: string]: number } = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  csharp: 51,
  php: 68,
  ruby: 72,
  go: 60,
  rust: 73,
  typescript: 74,
  swift: 83,
  kotlin: 78,
};

interface OutputDetails {
  status: {
    id: number;
    description: string;
  };
  compile_output?: string;
  stdout?: string;
  stderr?: string;
  time?: string;
  memory?: string;
  token?: string;
}

export default function Home() {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(``);
  const [processing, setProcessing] = useState(false);
  const [outputDetails, setOutputDetails] = useState<OutputDetails | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  // Collaboration states
  const [showCollabMenu, setShowCollabMenu] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const [joinRoomInput, setJoinRoomInput] = useState("");
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [copied, setCopied] = useState(false);

  const socketRef = useRef<Socket | null>(null);


  const changeLanguage = () => {
    if (language === "javascript") {
      setCode(`// Welcome to CodePilot! 🚀
// Click the Collaborate button to start coding with friends!

// Try the collaboration features:
// 1. Click 'Collaborate' to create or join a room
// 2. Share the room ID with friends
// 3. Code together in real-time!

console.log("Hello, World!");

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci sequence:");
for (let i = 0; i < 10; i++) {
  console.log(fibonacci(i));
}`)
    } else if (language === "python") {
      setCode(`
// Welcome to CodePilot! 🚀
// Click the Collaborate button to start coding with friends!

// Try the collaboration features:
// 1. Click 'Collaborate' to create or join a room
// 2. Share the room ID with friends
// 3. Code together in real-time!


print("Hello, World!")

def fibonacci(n):
    if n <= 1:
      return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print("Fibonacci sequence:")
    for i in range(10):
      print(fibonacci(i))
      `)
    } else if (language === "cpp") {
      setCode(`// Welcome to CodePilot! 🚀
// Click the Collaborate button to start coding with friends!

// Try the collaboration features:
// 1. Click 'Collaborate' to create or join a room
// 2. Share the room ID with friends
// 3. Code together in real-time!

#include <iostream>
using namespace std;

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    cout << "Hello, World!" << endl;
    cout << "Fibonacci sequence:" << endl;
    for (int i = 0; i < 10; i++) {
        cout << fibonacci(i) << endl;
    }
    return 0;
}
`)
    } else {
      setCode(`// Welcome to CodePilot! 🚀
// Click the Collaborate button to start coding with friends!

// Try the collaboration features:
// 1. Click 'Collaborate' to create or join a room
// 2. Share the room ID with friends
// 3. Code together in real-time!
`)

    }
  }

  useEffect(() => {
    changeLanguage();
  }, [language]);


  useEffect(() => {
    // Initialize socket once
    if (!socketRef.current) {
      socketRef.current = io("https://code-compiler-backend-wno4.onrender.com", {
        transports: ["websocket", "polling"],
      });
    }

    const socket = socketRef.current;

    // Listen for code changes from others
    socket.on("Code_changing", (data: { code: string }) => {
      setCode(data.code);
    });

    // Listen for language changes
    socket.on("change_configuration", (data: { language: string }) => {
      setLanguage(data.language);
    });

    // Listen for successful room join
    socket.on("joined_Successfully", (message: string) => {
      console.log("✅ Room joined successfully:", message);
      setIsInRoom(true);
      setShowCollabMenu(false);
    });

    // Listen for users in room updates
    socket.on("UsersInRoom", (users: string[]) => {
      console.log("👥 Users in room:", users);
      console.log("📊 Total users count:", users.length);
      setConnectedUsers(users.length);
    });

    // Listen for code run by others
    socket.on("code_ran_by_other", (data: { id: string }) => {
      console.log(`Code run by user: ${data.id}`);
      // You can add visual feedback here if needed
    });

    return () => {
      socket.off("Code_changing");
      socket.off("change_configuration");
      socket.off("joined_Successfully");
      socket.off("UsersInRoom");
      socket.off("code_ran_by_other");
    };
  }, []);

  // Generate random room ID
  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Create a new room
  const createRoom = () => {
    const newRoomId = generateRoomId();
    console.log("🚀 Creating room with ID:", newRoomId);
    setRoomId(newRoomId);

    if (socketRef.current) {
      // Join the room using your backend's joinRoom event
      socketRef.current.emit("joinRoom", newRoomId);
      console.log("📡 Emitted joinRoom event with ID:", newRoomId);
    }
  };

  // Join existing room
  const joinRoom = () => {
    if (joinRoomInput.trim() && socketRef.current) {
      const roomToJoin = joinRoomInput.trim().toUpperCase();
      console.log("🔗 Attempting to join room:", roomToJoin);
      setRoomId(roomToJoin);
      setJoinRoomInput(""); // Clear input after joining

      // Join the room using your backend's joinRoom event
      socketRef.current.emit("joinRoom", roomToJoin);
      console.log("📡 Emitted joinRoom event with ID:", roomToJoin);
    } else {
      console.log("❌ Cannot join room: No room ID provided");
    }
  };

  // Leave room
  const leaveRoom = () => {
    if (socketRef.current && roomId) {
      // Disconnect from socket to leave all rooms
      socketRef.current.disconnect();
      // Reconnect to maintain connection but leave rooms
      socketRef.current.connect();
    }
    setRoomId(null);
    setIsInRoom(false);
    setConnectedUsers(0);
    setShowCollabMenu(false);
  };

  // Copy room ID to clipboard
  const copyRoomId = async () => {
    if (roomId) {
      try {
        await navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  const runCode = async () => {
    if (!code.trim()) {
      alert("Please write some code before running!");
      return;
    }

    if (!LANGUAGE_ID_MAP[language]) {
      alert(`Language ${language} is not supported yet!`);
      return;
    }

    handleCompile();
  };

  const handleCompile = () => {
    setProcessing(true);
    setOutputDetails(null);
    setDebugInfo("Starting compilation...");

    const languageId = LANGUAGE_ID_MAP[language];

    const formData = {
      language_id: languageId,
      source_code: btoa(unescape(encodeURIComponent(code))),
      stdin: btoa(""),
    };

    console.log("Sending to Judge0:", {
      language_id: languageId,
      language_name: language,
      source_code_length: code.length,
      base64_encoded: true
    });

    setDebugInfo(`Submitting ${language} (ID: ${languageId}) code...`);

    const options = {
      method: "POST",
      url: "https://judge0-ce.p.rapidapi.com/submissions",
      params: {
        base64_encoded: "true",
        fields: "*"
      },
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        "X-RapidAPI-Key": "4acb8c3627msh52c071e0f2f02b6p10fae2jsn009c36756a2b",
      },
      data: formData,
    };

    axios
      .request(options)
      .then(function (response) {
        console.log("Judge0 Response:", response.data);
        const token = response.data.token;

        if (!token) {
          throw new Error("No token received from Judge0 API");
        }

        setDebugInfo(`Code submitted successfully. Token: ${token}`);
        checkStatus(token);
      })
      .catch((err) => {
        console.error("Judge0 API Error:", err);

        let errorMessage = "Unknown error occurred";

        if (err.response) {
          console.error("Response data:", err.response.data);
          console.error("Response status:", err.response.status);
          errorMessage = err.response.data?.error || `HTTP ${err.response.status}: ${err.response.statusText}`;
        } else if (err.request) {
          errorMessage = "No response from server. Check your internet connection.";
        } else {
          errorMessage = err.message;
        }

        setProcessing(false);
        setDebugInfo(`Error: ${errorMessage}`);
        setOutputDetails({
          status: { id: -1, description: "API Error" },
          stderr: btoa(`API Error: ${errorMessage}`)
        });
      });
  };

  const checkStatus = async (token: string) => {
    const options = {
      method: "GET",
      url: `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
      params: {
        base64_encoded: "true",
        fields: "*"
      },
      headers: {
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        "X-RapidAPI-Key": "4acb8c3627msh52c071e0f2f02b6p10fae2jsn009c36756a2b",
      },
    };

    try {
      let response = await axios.request(options);
      console.log("Status check response:", response.data);

      let statusId = response.data.status?.id;
      let statusDescription = response.data.status?.description;

      setDebugInfo(`Status: ${statusDescription} (ID: ${statusId})`);

      if (statusId === 1 || statusId === 2) {
        setTimeout(() => {
          checkStatus(token);
        }, 2000);
        return;
      } else {
        setProcessing(false);
        setOutputDetails(response.data);
        setDebugInfo(`Execution completed. Status: ${statusDescription}`);
        return;
      }
    } catch (err) {
      console.error("Status check error:", err);
      setProcessing(false);
      setDebugInfo(`Status check failed: ${err}`);
      setOutputDetails({
        status: { id: -1, description: "Status check failed" },
        stderr: btoa("Failed to get execution results. Please try again.")
      });
    }
  };

  const getOutput = (outputDetails: OutputDetails | null) => {
    if (!outputDetails) {
      return (
        <div className="px-2 py-1 font-normal text-xs text-gray-400">
          {processing ? "Code is running..." : "Waiting for code..."}
        </div>
      );
    }

    let statusId = outputDetails.status?.id;

    if (statusId === 6) {
      return (
        <pre className="px-2 py-1 font-normal text-xs text-red-500 whitespace-pre-wrap">
          <strong>Compilation Error:</strong>
          {"\n"}
          {outputDetails.compile_output ? atob(outputDetails.compile_output) : "Compilation failed"}
        </pre>
      );
    } else if (statusId === 3) {
      const stdout = outputDetails.stdout ? atob(outputDetails.stdout) : "";
      const stderr = outputDetails.stderr ? atob(outputDetails.stderr) : "";

      return (
        <div className="px-2 py-1 font-normal text-xs">
          {stdout && (
            <pre className="text-green-500 whitespace-pre-wrap mb-2">
              <strong>Output:</strong>
              {"\n"}
              {stdout}
            </pre>
          )}
          {stderr && (
            <pre className="text-yellow-500 whitespace-pre-wrap">
              <strong>Stderr:</strong>
              {"\n"}
              {stderr}
            </pre>
          )}
          {!stdout && !stderr && (
            <pre className="text-gray-400">No output</pre>
          )}
        </div>
      );
    } else if (statusId === 5) {
      return (
        <pre className="px-2 py-1 font-normal text-xs text-red-500">
          <strong>Time Limit Exceeded</strong>
        </pre>
      );
    } else if (statusId === 4) {
      return (
        <pre className="px-2 py-1 font-normal text-xs text-yellow-500">
          <strong>Wrong Answer</strong>
        </pre>
      );
    } else if (statusId === 11 || statusId === 12 || statusId === 13) {
      return (
        <pre className="px-2 py-1 font-normal text-xs text-red-500 whitespace-pre-wrap">
          <strong>Runtime Error:</strong>
          {"\n"}
          {outputDetails.stderr ? atob(outputDetails.stderr) : "Runtime error occurred"}
        </pre>
      );
    } else {
      return (
        <pre className="px-2 py-1 font-normal text-xs text-red-500 whitespace-pre-wrap">
          <strong>Error (Status {statusId}):</strong>
          {"\n"}
          {outputDetails.stderr ? atob(outputDetails.stderr) : `Unknown error occurred`}
        </pre>
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#0d1117] text-white p-4">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          🚀 CodePilot
        </h1>

        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => {
              const newLang = e.target.value;
              setLanguage(newLang);

              if (socketRef.current && roomId) {
                socketRef.current.emit("configuration_change", {
                  room: roomId,
                  language: newLang,
                });
              }
            }}
            className="bg-[#161b22] px-3 py-1 rounded border border-gray-600"
            disabled={processing}
          >
            {languageOptions.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>

          {/* Collaboration Button and Menu */}
          <div className="relative">
            {!isInRoom ? (
              <button
                onClick={() => setShowCollabMenu(!showCollabMenu)}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Collaborate</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="bg-green-600 px-3 py-2 rounded flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Room: {roomId}</span>
                  <span className="text-xs bg-green-700 px-2 py-1 rounded">
                    {connectedUsers} user{connectedUsers !== 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={copyRoomId}
                  className="bg-blue-600 hover:bg-blue-700 p-2 rounded transition-colors"
                  title="Copy Room ID"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={leaveRoom}
                  className="bg-red-600 hover:bg-red-700 p-2 rounded transition-colors"
                  title="Leave Room"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Collaboration Dropdown Menu */}
            {showCollabMenu && !isInRoom && (
              <div className="absolute top-full right-0 mt-2 bg-[#161b22] border border-gray-600 rounded-lg shadow-lg p-4 w-80 z-50">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-3">Start Collaborating</h3>

                  {/* Create Room Option */}
                  <div className="space-y-2">
                    <button
                      onClick={createRoom}
                      className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create New Room</span>
                    </button>
                    <p className="text-xs text-gray-400 text-center">
                      Creates a room instantly with a random ID that you can share
                    </p>
                  </div>

                  <div className="border-t border-gray-600 pt-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Or join existing room:
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Enter Room ID"
                          value={joinRoomInput}
                          onChange={(e) => setJoinRoomInput(e.target.value.toUpperCase())}
                          className="flex-1 bg-[#0d1117] border border-gray-600 rounded px-3 py-2 text-sm"
                          maxLength={6}
                        />
                        <button
                          onClick={joinRoom}
                          disabled={!joinRoomInput.trim()}
                          className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-2 rounded transition-colors"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Join</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCollabMenu(false)}
                    className="w-full text-center text-gray-400 hover:text-white text-sm mt-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            className={`px-4 py-2 rounded transition-colors ${processing
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
              }`}
            onClick={() => {
              runCode();
              if (socketRef.current && roomId) {
                socketRef.current.emit("code_ran", { room: roomId });
              }
            }}
            disabled={processing}
          >
            {processing ? "⏳ Running..." : "▶ Run"}
          </button>
        </div>
      </header>

      {/* Room Status Banner */}
      {isInRoom && (
        <div className="mb-4 p-3 bg-green-900/50 border border-green-600 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-green-300 font-medium">
                Collaborating in room {roomId} with {connectedUsers} user{connectedUsers !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-xs text-green-400">
              All changes are synced in real-time
            </div>
          </div>
        </div>
      )}

      {/* Debug Info Panel */}
      {debugInfo && (
        <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-600">
          <h3 className="text-sm font-semibold text-yellow-400 mb-1">Debug Info:</h3>
          <p className="text-xs text-gray-300">{debugInfo}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonacoEditor
          language={language}
          code={code}
          setCode={(newCode: string) => {
            setCode(newCode);

            if (socketRef.current && roomId) {
              socketRef.current.emit("code_change", { room: roomId, input: newCode });
            }
          }}
        />
        <div className="grid grid-cols-1 gap-4">
          <OutputPanel output={getOutput(outputDetails)} />
          <AISuggestions
            output={getOutput(outputDetails)}
            code={code}
            language={language}
            onCodeGenerated={setCode}
          />
        </div>
      </div>
    </main>
  );
}