from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_connection

app = Flask(__name__)
CORS(app)


# ===== GET ALL TASKS & ADD TASK =====
@app.route('/tasks', methods=['GET', 'POST'])
def handle_tasks():

    # ADD A NEW TASK
    if request.method == 'POST':
        try:
            data = request.json
            title = data.get('title', '').strip()
            priority = data.get('priority', 'medium')
            due_date = data.get('due_date', None)

            if not title:
                return jsonify({"error": "Title cannot be empty"}), 400

            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO tasks (title, priority, due_date) VALUES (%s, %s, %s)",
                (title, priority, due_date)
            )
            conn.commit()
            conn.close()
            return jsonify({"message": "Task added successfully!"}), 201

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # GET ALL TASKS
    if request.method == 'GET':
        try:
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM tasks ORDER BY created_at DESC")
            tasks = cursor.fetchall()
            conn.close()

            # Convert date objects to strings for JSON
            for task in tasks:
                if task.get('due_date'):
                    task['due_date'] = str(task['due_date'])
                if task.get('created_at'):
                    task['created_at'] = str(task['created_at'])

            return jsonify(tasks), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500


# ===== UPDATE TASK STATUS =====
@app.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    try:
        data = request.json
        status = data.get('status')

        if status not in ['pending', 'completed']:
            return jsonify({"error": "Invalid status"}), 400

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE tasks SET status=%s WHERE id=%s",
            (status, task_id)
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Task updated successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===== DELETE TASK =====
@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tasks WHERE id=%s", (task_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Task deleted successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)