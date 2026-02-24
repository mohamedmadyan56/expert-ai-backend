# Portfolio Feature Documentation

## Overview

- **Front-end component**: `expert-ai-client/src/components/portfolioPage.tsx`
- **Back-end routes**: `Routes/portfolioRoutes.ts`
- **Back-end controller**: `Controllers/portfolioController.ts`
- **Mongoose model**: `models/Portfolio.ts`

This feature manages the expert's portfolio:

- List all projects for a specific expert.
- Create a new portfolio project with an uploaded image.
- Delete an existing project with proper authorization.

---

## Data Model – `Portfolio`

**File**: `models/Portfolio.ts`

Represents a single portfolio project in MongoDB using Mongoose.

### Schema Fields

- **`expert`** (`ObjectId`, required)
  - Reference to the `User` model.
  - Identifies the owner (expert) of the project.

- **`title`** (`String`, required)
  - Project title.
  - Trimmed, max length 100 characters.

- **`description`** (`String`, required)
  - Project description.

- **`imageUrl`** (`String`, required)
  - URL of the uploaded project image (stored on Cloudinary).

- **`category`** (`String`, required)
  - Category of the project.
  - Allowed values: `Design`, `Development`, `Marketing`, `Writing`, `Other`.

- **`link`** (`String`, optional)
  - Optional external or live link to the project.

- **`createdAt`** (`Date`, default: `Date.now`)
  - Creation timestamp.

---

## Routes – `portfolioRoutes`

**File**: `Routes/portfolioRoutes.ts`

Base path: `/api/v1/portfolio`

Defined routes:

- **GET `/`** → `getAllPortfolio`
  - Returns all portfolio items for the current expert.

- **POST `/`** → `createPortfolio` (with `upload.single('image')`)
  - Creates a new portfolio item and uploads an image.

- **DELETE `/:id`** → `deletePortfolio`
  - Deletes a portfolio item by ID (with ownership check).

Middleware:

- `upload.single('image')` handles single image upload for the `image` field in the request body.

---

## Controller – `portfolioController`

**File**: `Controllers/portfolioController.ts`

### 1. `createPortfolio`

**Purpose**: create a new portfolio item for an expert and upload its image to Cloudinary.

**Request**:

- **Method**: `POST /api/v1/portfolio`
- **Headers**:
  - `userid`: expert ID (MongoDB ObjectId as string)
- **Body (multipart/form-data)**:
  - `title` (string, required)
  - `description` (string, required)
  - `category` (string, required)
  - `image` (file, required)
  - `link` (string, optional)

**Main steps**:

1. **Validate image file**
   - If `req.file` is missing → return `400` with message to upload an image.

2. **Read expert ID from headers**
   - `const expertId = req.get('userid');`
   - If missing → return `401` with message that `userid` header is required.

3. **Upload image to Cloudinary**
   - Convert buffer to Base64 data URL:
     - `data:${req.file.mimetype};base64,<buffer-as-base64>`
   - Call `cloudinary.uploader.upload(...)` with folder `expertly_portfolio`.

4. **Create MongoDB document**
   - Use `Portfolio.create()` with:
     - `expert`, `title`, `description`, `imageUrl` (from Cloudinary), `category`, `link`.

5. **Send response**
   - Status `201`, JSON body:
     - `{ status: 'success', data: newWork }`

6. **Error handling**
   - For known errors: return `400` with `error.message`.
   - For unknown errors: return `400` with generic `Unknown error occurred`.

---

### 2. `getAllPortfolio`

**Purpose**: get all portfolio items for the current expert.

**Request**:

- **Method**: `GET /api/v1/portfolio`
- **Headers**:
  - `userid`: expert ID

**Logic**:

1. Read `expertId` from header: `req.get('userid')`.
2. Query MongoDB:
   - `Portfolio.find({ expert: expertId }).sort({ createdAt: -1 })`
3. Return response:
   - Status `200`
   - Body:
     - `{ status: 'success', results: works.length, data: works }`
4. On error:
   - Status `400` with message: `'حدث خطأ اثناء جلب البيانات'`.

This endpoint feeds the front-end list of portfolio items.

---

### 3. `deletePortfolio`

**Purpose**: delete a specific portfolio item **only if** the requester is the owner expert.

**Request**:

- **Method**: `DELETE /api/v1/portfolio/:id`
- **Headers**:
  - `userid`: expert ID (the user attempting to delete)
- **Params**:
  - `id`: portfolio item ID to delete

**Detailed flow**:

1. **Read parameters**
   - `const { id } = req.params;`
   - `const expertId = req.get('userid');`

2. **Find the portfolio item**
   - `const portfolioItem = await Portfolio.findById(id);`
   - If not found → return `404` with:
     - `{ status: 'fail', message: 'المشروع غير موجود' }`

3. **Authorization check**
   - Compare the owner of the item with the `userid` header:
     - `portfolioItem.expert.toString() !== expertId`
   - If they are different → return `403` with:
     - `{ status: 'fail', message: 'غير مسموح لك بمسح هذا المشروع، لست أنت صاحبه!' }`

4. **Delete from database**
   - `await Portfolio.findByIdAndDelete(id);`

5. **Send success response**
   - Status `204` (`No Content`), body:
     - `{ status: 'success', data: null }`

6. **Error handling**
   - On unexpected error:
     - Status `400`, with message:
       - `error.message` if instance of `Error`
       - Otherwise: `'حدث خطأ أثناء المسح'`

---

## Front-end – `PortfolioPage` Component

**File**: `expert-ai-client/src/components/portfolioPage.tsx`

### Main responsibilities

- Fetch and display the expert's portfolio items.
- Provide UI to add a new project (with image upload).
- Provide UI to delete a project with confirmation.
- Filter projects by category.

### Types and configuration

- `PortfolioItem` interface represents the front-end version of a portfolio item.  
  Fields mirror the Mongoose model: `_id`, `title`, `description`, `imageUrl`, `category`, `link`, `createdAt`.

- Constants:
  - `EXPERT_ID`: hard-coded expert ID used in request headers.
  - `API_BASE`: base URL for portfolio API (`http://localhost:5000/api/v1/portfolio`).
  - `CATEGORY_*` maps: used for styling based on category.

---

### Fetching portfolio – `fetchPortfolio`

Called on initial mount via `useEffect`.

1. Set `fetching = true`.
2. Send `GET` request:
   - `axios.get(API_BASE, { headers: { userid: EXPERT_ID } })`
3. On success:
   - `setWorks(res.data.data)` to store the portfolio items.
4. On error:
   - Show toast: `'حدث خطأ أثناء جلب البيانات'`.
5. Finally:
   - Set `fetching = false`.

The UI:

- Shows a loading spinner while `fetching` is true.
- Shows an empty state if there are no items.
- Otherwise, displays items in a responsive grid.

---

### Creating a new project – `handleSubmit`

Triggered from the "Add Project" modal form.

1. Prevent default form submit.
2. Validate that an image is selected; otherwise show error toast.
3. Build a `FormData` object:
   - Append `title`, `description`, `category`, `image`, and optional `link`.
4. Send `POST` request:
   - `axios.post(API_BASE, fd, { headers: { userid: EXPERT_ID, 'Content-Type': 'multipart/form-data' } })`
5. On success:
   - Show success toast `'تمت إضافة العمل بنجاح ✓'`.
   - Clear form state and preview.
   - Close the modal.
   - Call `fetchPortfolio()` to refresh the list.
6. On error:
   - Show server error message if provided, otherwise `'حدث خطأ أثناء الرفع'`.
7. Manage `loading` flag to disable button and show spinner.

---

## Delete Flow – End-to-End

This section explains exactly how **delete** works across front-end and back-end.

### 1. User interaction (front-end)

1. Each project card (`WorkCard`) renders a delete button (`✕`).
2. When the delete button is clicked, it calls `onDelete`, which in the parent sets:
   - `setDeleteId(item._id);`
3. When `deleteId` is not `null`, a confirmation modal is displayed:
   - Shows warning text and "Cancel" / "Delete" buttons.
4. If the user clicks **"حذف"** in the modal:
   - It calls `handleDelete(deleteId)`.

### 2. Front-end `handleDelete` logic

Steps inside `handleDelete`:

1. Send `DELETE` request:
   - URL: `${API_BASE}/${id}`
   - Headers: `{ userid: EXPERT_ID }`
2. On success:
   - Update local state without an extra fetch:
     - `setWorks(prev => prev.filter(w => w._id !== id));`
   - Show toast: `'تم حذف المشروع بنجاح'`.
3. On error:
   - Show toast: `'فشل الحذف، قد لا تملك الصلاحية'`.
4. In all cases:
   - Reset `deleteId` to `null` to close the confirmation modal.

### 3. Back-end `deletePortfolio` logic

Triggered by the `DELETE /api/v1/portfolio/:id` route.

1. Read `id` from route params and `expertId` from headers.
2. Look up the portfolio item by ID:
   - If not found → `404` with `'المشروع غير موجود'`.
3. Check authorization:
   - Compare `portfolioItem.expert.toString()` with `expertId`.
   - If mismatch → `403` with message about not owning the project.
4. If authorized:
   - Delete using `Portfolio.findByIdAndDelete(id)`.
   - Respond with status `204` and `{ status: 'success', data: null }`.

### 4. Resulting behavior

- Only the owner expert (whose ID matches the `expert` field) can delete a project.
- Front-end list is immediately updated by removing the deleted item from state.
- The user receives clear success or error feedback via toasts.

---

## How Pieces Fit Together

1. **Model** defines the shape of portfolio data in MongoDB.
2. **Controller** functions implement the business logic:
   - `createPortfolio`: validation, image upload, creation.
   - `getAllPortfolio`: fetching all works for an expert.
   - `deletePortfolio`: secure deletion with ownership check.
3. **Routes** map HTTP requests to controller functions under `/api/v1/portfolio`.
4. **Front-end component**:
   - Talks to these routes using Axios.
   - Manages UI state (loading, modals, filters, toasts).
   - Renders data returned by the API and provides user interactions for create/delete.

Together, they form a complete portfolio feature where:

- Each expert sees and manages only their own portfolio.
- Images are stored externally on Cloudinary but referenced in MongoDB.
- Deletion is secure and reflected immediately in the UI.

