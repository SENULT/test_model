# Thiết Kế Phần Mềm - Bynce

## 📋 Tổng Quan

**Bynce** là một ứng dụng web 3D cho phép người dùng điều khiển các mô hình MMD (MikuMikuDance) thông qua AI motion capture và các file animation có sẵn. Ứng dụng được xây dựng theo kiến trúc component-based sử dụng React và TypeScript.

---

## 🏗️ Kiến Trúc Hệ Thống

### **1. Kiến Trúc Tổng Thể**

```
┌─────────────────────────────────────────────────────────┐
│                   User Interface (React)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │  Header  │  │  Footer  │  │  Drawer  │  │  Popup  ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              Core Components (Containers)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │MMDScene  │  │  Motion  │  │Animation │  │Materials││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                 3D Rendering Engine                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Babylon.js Engine                      │  │
│  │  • Scene Management  • Camera Control             │  │
│  │  • Lighting System   • Shadow Generation          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              Processing Modules (WASM)                   │
│  ┌─────────────────┐      ┌──────────────────────┐    │
│  │  MediaPipe AI   │      │   Pose Solver        │    │
│  │  (Body/Face/    │  →   │   (Rust WASM)        │    │
│  │   Hand Detect)  │      │   (3D → Quaternion)  │    │
│  └─────────────────┘      └──────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Cấu Trúc Thư Mục

```
Bynce/
├── src/
│   ├── App.tsx                 # Component chính - State management
│   ├── main.tsx                # Entry point
│   │
│   ├── Components/
│   │   ├── Header.tsx          # Header với logo, social links
│   │   ├── Footer.tsx          # Navigation buttons (Model/BG/Animation)
│   │   ├── MMDScene.tsx        # 3D Scene renderer (Babylon.js)
│   │   ├── Motion.tsx          # Video/Webcam input + AI detection
│   │   ├── Animation.tsx       # VMD animation player
│   │   ├── Model.tsx           # Model selector
│   │   ├── Background.tsx      # Background selector
│   │   ├── Skeleton.tsx        # Manual bone editor
│   │   ├── Materials.tsx       # Material visibility toggle
│   │   └── DebugScene.tsx      # Debug visualization
│   │
│   ├── assets/
│   │   ├── base.css            # Global styles
│   │   ├── main.css            # Component styles
│   │   └── backgroundGround.png
│   │
│   └── index.d.ts              # TypeScript type definitions
│
├── public/
│   ├── animation/              # VMD animation files
│   │   ├── Stand.vmd
│   │   ├── Miku.vmd
│   │   └── ...
│   ├── avatar/                 # Model preview images
│   ├── background/             # 360° background images
│   └── logo.png
│
├── GawrGura/                   # MMD model files
│   ├── GawrGura.pmx
│   ├── GawrGura_hoodoff.pmx
│   └── textures...
│
├── pose_solver/                # Rust WASM module
│   ├── src/lib.rs              # Pose calculation logic
│   └── pkg/                    # Compiled WASM output
│
└── vite.config.ts              # Build configuration
```

---

## 🔄 Luồng Dữ Liệu (Data Flow)

### **1. Motion Capture Flow**

```
User Input (Video/Webcam)
    ↓
[Motion.tsx]
    ↓
MediaPipe Holistic Landmarker
    ↓
Body Landmarks (33 points)
Hand Landmarks (21 × 2)
Face Landmarks (468 points)
    ↓
[App.tsx State: body]
    ↓
[MMDScene.tsx]
    ↓
Pose Solver (WASM)
    ↓
Bone Rotations (Quaternions)
    ↓
Apply to MMD Model Bones
    ↓
Render 3D Scene
```

### **2. Animation Playback Flow**

```
User Selects VMD File
    ↓
[Animation.tsx]
    ↓
[App.tsx State: selectedAnimation]
    ↓
[MMDScene.tsx]
    ↓
VmdLoader.loadAsync()
    ↓
MmdWasmAnimation
    ↓
Apply to Model
    ↓
Play Animation Timeline
```

---

## 🎯 Component Chi Tiết

### **App.tsx - State Management Hub**

**Trách nhiệm:**
- Quản lý toàn bộ application state
- Điều phối giữa các components
- Handle user interactions

**Key States:**
```typescript
body: Body                      // AI detected landmarks
selectedModel: string           // Current 3D model
selectedAnimation: string       // Current VMD animation
selectedBackground: string      // Scene background
boneRotation: object           // Manual bone adjustments
materials: string[]            // Model material list
isPlaying: boolean             // Animation play state
lerpFactor: number             // Smoothing factor
```

**Props Flow:**
```
App.tsx
  ├→ Header.tsx (no props)
  ├→ Footer.tsx (setOpenDrawer, setActiveTab)
  ├→ MMDScene.tsx (body, selectedModel, animations, etc.)
  ├→ Drawer
  │   ├→ Motion.tsx (body, setBody)
  │   ├→ Animation.tsx (selectedAnimation, setSelectedAnimation)
  │   ├→ Model.tsx (setSelectedModel)
  │   ├→ Background.tsx (selectedBackground, setSelectedBackground)
  │   ├→ Skeleton.tsx (setBoneRotation)
  │   └→ Materials.tsx (materials, setMaterialVisible)
```

---

### **MMDScene.tsx - 3D Rendering Core**

**Trách nhiệm:**
- Khởi tạo Babylon.js engine và scene
- Load và quản lý MMD models
- Apply animations và bone rotations
- Handle camera, lighting, shadows
- VMD recording và export

**Key Methods:**

```typescript
// Scene initialization
createScene(canvas) 
  → Engine setup
  → Camera, lights, ground
  → Shadow generator

// Model loading
loadMMD()
  → SceneLoader.ImportMeshAsync()
  → Create MMD model with physics
  → Extract bone references

// Animation
loadAnimation()
  → VmdLoader.loadAsync()
  → MmdWasmAnimation
  → Play/pause controls

// Real-time pose update
updateMMDPose(body)
  → PoseSolver.solve()
  → setBoneRotation() for each bone
  → Apply morph targets (facial expressions)

// VMD Recording
recordFrame()
  → Capture bone rotations (30 FPS)
  → Store as RecordedFrame[]

createVMD()
  → Encode to Shift-JIS
  → Write VMD binary format
  → Export as .vmd file
```

**Refs Management:**
```typescript
canvasRef           // Canvas element
sceneRef            // Babylon.js Scene
engineRef           // Babylon.js Engine
cameraRef           // ArcRotateCamera
mmdModelRef         // Current MMD model
mmdRuntimeRef       // Animation runtime
poseSolverRef       // WASM pose solver
keyBones            // Important bone references
```

---

### **Motion.tsx - AI Detection Module**

**Trách nhiệm:**
- Handle video/image upload
- Webcam stream management
- MediaPipe AI integration
- Extract and send landmarks to App

**Key Features:**

```typescript
// Input sources
- Video upload (.mp4, .webm)
- Image upload (.jpg, .png)
- Webcam real-time capture

// MediaPipe setup
HolisticLandmarker.createFromOptions()
  → Model path: "holistic_landmarker.task"
  → Detect: pose, face, hands
  → Running mode: VIDEO or IMAGE

// Detection loop
detectPose(video/image)
  → Extract landmarks
  → Update body state
  → Trigger re-render
```

---

### **Animation.tsx - Timeline Controller**

**Trách nhiệm:**
- Load và select VMD animations
- Play/pause controls
- Timeline scrubbing
- Upload custom VMD files

**UI Components:**
```typescript
- Animation selector (Radio buttons)
- Play/Pause button
- Timeline slider
- Time display (current/remaining)
- VMD upload button
```

---

### **Skeleton.tsx - Manual Bone Editor**

**Trách nhiệm:**
- Hiển thị cây bone hierarchy
- Sliders cho rotation (X, Y, Z)
- Real-time bone manipulation

**Structure:**
```typescript
Categories:
  ├─ Body (center, neck, upperBody, lowerBody)
  ├─ Legs (leftLeg, rightLeg, knees, ankles)
  ├─ Arms (forearms, elbows, wrists)
  ├─ Eyes (leftEye, rightEye)
  └─ Fingers (thumbs, index, middle, ring, pinky)

Each bone:
  - 3 sliders (X, Y, Z rotation)
  - Range: -π to π
  - Real-time update via setBoneRotation()
```

---

## 🧮 Thuật Toán Chính

### **1. Pose to Quaternion Conversion (Rust WASM)**

**File:** `pose_solver/src/lib.rs`

```rust
PoseSolver::solve(mainBody, leftHand, rightHand, face)
  → Calculate bone rotations:
    
    // Body bones
    upper_body = calculate_upper_body_rotation(shoulders)
    lower_body = calculate_lower_body_rotation(hips)
    neck = calculate_neck_rotation(nose, shoulders)
    
    // Limbs
    left_upper_arm = calculate_upper_arm_rotation(shoulder, elbow)
    left_lower_arm = calculate_lower_arm_rotation(elbow, wrist)
    
    // Hands (finger joints)
    thumb_mcp = calculate_finger_rotation(landmarks)
    index_mcp = ...
    
    // Face
    left_eye_rotation = calculate_eye_rotation(face)
    mouth_openness = calculate_mouth_openness(face)
    
  → Return PoseSolverResult (all rotations)
```

**Math Operations:**
- Vector3 calculations
- Quaternion rotations (UnitQuaternion)
- Direction vector normalization
- Slerp interpolation

---

### **2. VMD Binary Encoding**

**File:** `MMDScene.tsx - createVMD()`

```typescript
VMD File Structure:
  Header (30 bytes)
    → "Vocaloid Motion Data 0002"
  Model Name (20 bytes)
  
  Bone Keyframes:
    Count (4 bytes)
    For each frame:
      - Bone name (15 bytes, Shift-JIS)
      - Frame number (4 bytes)
      - Position (12 bytes: x, y, z)
      - Rotation (16 bytes: quaternion)
      - Interpolation (64 bytes)
  
  Morph Keyframes:
    Count (4 bytes)
    For each frame:
      - Morph name (15 bytes, Shift-JIS)
      - Frame number (4 bytes)
      - Weight (4 bytes: float)
  
  Camera/Light/Shadow (0 for this app)
```

---

### **3. Smooth Interpolation (Lerp)**

```typescript
// Linear interpolation for smooth transitions
Quaternion.Slerp(
  currentRotation,
  targetRotation,
  lerpFactor  // 0.0 = no change, 1.0 = instant
)

// Example:
lerpFactor = 0.5  → Smooth, delayed
lerpFactor = 1.0  → Instant, snappy
```

---

## 🎨 UI/UX Design

### **Layout Structure**

```
┌─────────────────────────────────────────────┐
│  Header [Logo] [Title] [Social Links]      │
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│          3D Scene (Canvas)                  │
│                                             │
│  [Camera Reset] [Split View]               │
│  [Screenshot] [Record VMD]                  │
│                                             │
├─────────────────────────────────────────────┤
│  Footer:  [Model] [Background]             │
│           [Skeleton] [Animation]            │
└─────────────────────────────────────────────┘
         ↑
    Opens Drawer →
```

### **Drawer Menu System**

```typescript
Footer Button Click
  ↓
setActiveTab("model" | "background" | "skeleton" | "animation")
  ↓
setOpenDrawer(true)
  ↓
<Drawer> renders corresponding component
  ↓
User interaction
  ↓
Update App state
  ↓
MMDScene re-renders
```

---

## 🔧 Công Nghệ Sử Dụng

### **Frontend Framework**
- **React 18.3** - Component library
- **TypeScript 5.5** - Type safety
- **Vite 5.4** - Build tool (fast HMR)

### **3D Graphics**
- **Babylon.js 7.27** - 3D engine
- **babylon-mmd 0.55** - MMD loader/player
- **WebGL 2.0** - GPU rendering

### **AI/ML**
- **MediaPipe 0.10.15** - Pose/face/hand detection
- **TensorFlow.js** (via MediaPipe) - Neural networks

### **Performance**
- **WebAssembly (WASM)** - Fast pose calculations
- **Rust** - Compiled to WASM
- **Web Workers** - Background processing

### **UI Components**
- **Material-UI (MUI) 6.1** - React components
- **FontAwesome 6.6** - Icons
- **Emotion** - CSS-in-JS styling

### **Build Tools**
- **vite-plugin-wasm** - WASM support
- **vite-plugin-top-level-await** - Async modules
- **ESLint** - Code linting
- **TypeScript ESLint** - TS linting

---

## ⚡ Tối Ưu Hiệu Năng

### **1. Code Splitting**

```typescript
// vite.config.ts
manualChunks: {
  'babylon': ['@babylonjs/core'],
  'babylon-mmd': ['babylon-mmd']
}
```

→ Tách các thư viện lớn thành chunks riêng
→ Lazy loading khi cần

### **2. WASM Optimization**

```rust
// Rust compiled to WASM
→ Near-native performance
→ 10-100x faster than JavaScript
→ Parallel processing potential
```

### **3. GPU Acceleration**

```typescript
// Babylon.js Engine options
{
  powerPreference: "high-performance",
  antialias: false,  // Trade quality for speed
  stencil: false,
  preserveDrawingBuffer: false
}
```

### **4. Render Optimization**

```typescript
// Only update when needed
useEffect(() => {
  updateMMDPose(mmdModel, body)
}, [body, lerpFactor])  // Dependency array

// Shadow quality
shadowGenerator.filteringQuality = QUALITY_HIGH
shadowGenerator.usePercentageCloserFiltering = true
```

---

## 🔐 Bảo Mật & Privacy

### **Client-Side Processing**
- ✅ **Tất cả AI processing chạy trên browser**
- ✅ **Không upload video/ảnh lên server**
- ✅ **Dữ liệu không rời khỏi máy người dùng**

### **CORS Headers**
```typescript
// vercel.json & vite.config.ts
'Cross-Origin-Opener-Policy': 'same-origin'
'Cross-Origin-Embedder-Policy': 'require-corp'
```
→ Bảo vệ SharedArrayBuffer (WASM requirement)

---

## 📊 State Management Pattern

```typescript
// Centralized state in App.tsx
const [state, setState] = useState(initialValue)

// Pass down as props
<Component value={state} onChange={setState} />

// Child component updates parent
onChange(newValue) → setState(newValue)

// MMDScene listens and re-renders
useEffect(() => {
  // React to state changes
}, [state])
```

**Advantage:**
- Single source of truth
- Predictable data flow
- Easy debugging

---

## 🚀 Deployment

### **Build Process**

```bash
npm run build
  ↓
TypeScript compilation (tsc -b)
  ↓
Vite bundling
  ↓
Output: dist/ folder
  ↓
Deploy to Vercel/Netlify
```

### **Static Assets**
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js      # Main bundle
│   ├── babylon-[hash].js    # 3D engine chunk
│   ├── index-[hash].css     # Styles
│   └── *.wasm               # WASM modules
└── public files copied
```

---

## 🐛 Error Handling

### **Common Issues & Solutions**

**1. WASM Loading Errors**
```typescript
// Solution: Proper MIME types
assetsInclude: ['**/*.wasm']
server.fs.allow: ['..']
```

**2. Model Not Found**
```typescript
// Check path: ../GawrGura/ModelName.pmx
// Ensure files exist in correct folder
```

**3. MediaPipe Initialization**
```typescript
try {
  await HolisticLandmarker.createFromOptions()
} catch (error) {
  console.error("MediaPipe failed:", error)
  // Fallback or user notification
}
```

---

## 🔮 Khả Năng Mở Rộng

### **Có thể thêm:**

1. **Multi-character support**
   - Load nhiều models cùng lúc
   - Group choreography

2. **Audio integration**
   - Music upload
   - Audio-reactive animations

3. **Advanced recording**
   - Camera keyframes export
   - Lighting export to VMD

4. **Social features**
   - Share animations (cloud storage)
   - Community animation library

5. **VR/AR support**
   - WebXR integration
   - Hand tracking với VR controllers

---

## 📝 Coding Conventions

### **File Naming**
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `index.d.ts`

### **Component Structure**
```typescript
// 1. Imports
import { ... } from 'library'

// 2. Types/Interfaces
interface Props { ... }

// 3. Constants
const CONSTANT = value

// 4. Component
function Component({ props }: Props): JSX.Element {
  // 4a. Hooks
  const [state, setState] = useState()
  
  // 4b. Refs
  const ref = useRef()
  
  // 4c. Effects
  useEffect(() => {}, [])
  
  // 4d. Handlers
  const handleClick = () => {}
  
  // 4e. Render
  return <div>...</div>
}

// 5. Export
export default Component
```

---

## 🎓 Kết Luận

**Bynce** là một ứng dụng phức tạp kết hợp:
- ✅ 3D graphics (Babylon.js)
- ✅ AI/ML (MediaPipe)
- ✅ High-performance computing (Rust/WASM)
- ✅ Modern web framework (React/TypeScript)
- ✅ Real-time processing

**Điểm mạnh:**
- Chạy hoàn toàn trên browser (privacy)
- Performance cao nhờ WASM
- UI/UX trực quan
- Hỗ trợ nhiều input sources

**Ứng dụng thực tế:**
- Virtual streaming (VTuber)
- Animation creation
- Motion capture cho game/film
- Educational tool

---

**Được thiết kế và phát triển bởi:** Elianio  
**Repository:** [Bynce](https://github.com/Elianio/Bynce)  
**License:** GNU GPL v3
