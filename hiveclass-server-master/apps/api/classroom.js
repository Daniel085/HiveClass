/**
 * Classroom API
 *
 * Handles classroom CRUD operations for HiveClass
 * Provides endpoints for both teachers and students
 */

const Boom = require('@hapi/boom');

// In-memory storage for classrooms
// TODO: Replace with database in production
const classrooms = new Map();
const classroomsByTeacher = new Map();

/**
 * Generate a random 6-character classroom code
 */
function generateClassroomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous characters
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ensure uniqueness
    if (classrooms.has(code)) {
        return generateClassroomCode();
    }
    return code;
}

/**
 * Create a new classroom
 * POST /api/classroom/create
 */
const createClassroom = {
    method: 'POST',
    path: '/api/classroom/create',
    options: {
        auth: 'session',
        handler: async (request, h) => {
            const { teacherEmail, name } = request.payload;

            if (!teacherEmail || !name) {
                throw Boom.badRequest('Missing required fields: teacherEmail and name');
            }

            const id = `classroom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const code = generateClassroomCode();

            const classroom = {
                id,
                name,
                code,
                teacherEmail,
                createdAt: new Date().toISOString(),
                isOpen: true,
                students: []
            };

            // Store classroom
            classrooms.set(id, classroom);
            classrooms.set(code, classroom); // Also store by code for quick lookup

            // Track by teacher
            if (!classroomsByTeacher.has(teacherEmail)) {
                classroomsByTeacher.set(teacherEmail, []);
            }
            classroomsByTeacher.get(teacherEmail).push(id);

            console.log(`[Classroom] Created: ${name} (${code}) for ${teacherEmail}`);

            return h.response(classroom).code(201);
        }
    }
};

/**
 * Get classroom by ID
 * GET /api/classroom/{id}
 */
const getClassroom = {
    method: 'GET',
    path: '/api/classroom/{id}',
    options: {
        auth: 'session',
        handler: async (request, h) => {
            const { id } = request.params;

            const classroom = classrooms.get(id);
            if (!classroom) {
                throw Boom.notFound('Classroom not found');
            }

            return h.response(classroom);
        }
    }
};

/**
 * List all classrooms for a teacher
 * GET /api/classroom/teacher/list
 */
const listTeacherClassrooms = {
    method: 'GET',
    path: '/api/classroom/teacher/list',
    options: {
        auth: 'session',
        handler: async (request, h) => {
            // Get user profile from cookie
            const profile = request.state.hiveschool_id;
            const userEmail = profile ? profile.email : null;

            if (!userEmail) {
                throw Boom.unauthorized('User not authenticated');
            }

            const classroomIds = classroomsByTeacher.get(userEmail) || [];
            const teacherClassrooms = classroomIds
                .map(id => classrooms.get(id))
                .filter(classroom => classroom !== undefined);

            console.log(`[Classroom] Listed ${teacherClassrooms.length} classrooms for ${userEmail}`);

            return h.response(teacherClassrooms);
        }
    }
};

/**
 * Close a classroom
 * POST /api/classroom/{id}/close
 */
const closeClassroom = {
    method: 'POST',
    path: '/api/classroom/{id}/close',
    options: {
        auth: 'session',
        handler: async (request, h) => {
            const { id } = request.params;

            const classroom = classrooms.get(id);
            if (!classroom) {
                throw Boom.notFound('Classroom not found');
            }

            classroom.isOpen = false;
            classroom.closedAt = new Date().toISOString();

            console.log(`[Classroom] Closed: ${classroom.name} (${classroom.code})`);

            return h.response({ success: true }).code(200);
        }
    }
};

/**
 * Join classroom with access code
 * POST /api/classroom/join
 */
const joinClassroom = {
    method: 'POST',
    path: '/api/classroom/join',
    options: {
        auth: 'session',
        handler: async (request, h) => {
            const { code } = request.payload;

            if (!code) {
                throw Boom.badRequest('Missing required field: code');
            }

            const classroom = classrooms.get(code.toUpperCase());
            if (!classroom) {
                throw Boom.notFound('Classroom not found. Please check the access code.');
            }

            if (!classroom.isOpen) {
                throw Boom.forbidden('This classroom is no longer accepting students');
            }

            console.log(`[Classroom] Student joining: ${classroom.name} (${classroom.code})`);

            return h.response(classroom);
        }
    }
};

/**
 * Join classroom by ID (from list)
 * POST /api/classroom/{id}/join
 */
const joinClassroomById = {
    method: 'POST',
    path: '/api/classroom/{id}/join',
    options: {
        auth: 'session',
        handler: async (request, h) => {
            const { id } = request.params;

            const classroom = classrooms.get(id);
            if (!classroom) {
                throw Boom.notFound('Classroom not found');
            }

            if (!classroom.isOpen) {
                throw Boom.forbidden('This classroom is no longer accepting students');
            }

            console.log(`[Classroom] Student joining by ID: ${classroom.name} (${classroom.code})`);

            return h.response(classroom);
        }
    }
};

/**
 * List all open classrooms (for students)
 * GET /api/classroom/list
 */
const listClassrooms = {
    method: 'GET',
    path: '/api/classroom/list',
    options: {
        auth: 'session',
        handler: async (request, h) => {
            const openClassrooms = Array.from(classrooms.values())
                .filter(classroom =>
                    classroom.isOpen &&
                    classroom.id === classroom.id // Filter duplicates (we store by both id and code)
                )
                // Remove duplicates by using a Set of IDs
                .filter((classroom, index, self) =>
                    index === self.findIndex((c) => c.id === classroom.id)
                );

            console.log(`[Classroom] Listed ${openClassrooms.length} open classrooms`);

            return h.response(openClassrooms);
        }
    }
};

/**
 * Exit classroom
 * POST /api/classroom/{id}/exit
 */
const exitClassroom = {
    method: 'POST',
    path: '/api/classroom/{id}/exit',
    options: {
        auth: 'session',
        handler: async (request, h) => {
            const { id } = request.params;

            const classroom = classrooms.get(id);
            if (!classroom) {
                throw Boom.notFound('Classroom not found');
            }

            console.log(`[Classroom] Student exited: ${classroom.name} (${classroom.code})`);

            return h.response({ success: true }).code(200);
        }
    }
};

/**
 * Register all classroom routes
 */
module.exports = {
    name: 'classroom-api',
    version: '1.0.0',
    register: async function (server, options) {
        server.route([
            createClassroom,
            getClassroom,
            listTeacherClassrooms,
            closeClassroom,
            joinClassroom,
            joinClassroomById,
            listClassrooms,
            exitClassroom
        ]);

        console.log('[Classroom API] Routes registered');
    }
};
