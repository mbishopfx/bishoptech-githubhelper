import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get specific todo list with items
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data: todoList, error } = await supabase
      .from('todo_lists')
      .select(`
        *,
        repository:repositories(name, full_name),
        items:todo_items(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!todoList) {
      return NextResponse.json({ success: false, error: 'Todo list not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      todoList
    });

  } catch (error: any) {
    console.error('Todo List API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - Update todo list
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const { data: todoList, error } = await supabase
      .from('todo_lists')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Todo list updated successfully',
      todoList
    });

  } catch (error: any) {
    console.error('Update Todo List API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Delete todo list
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Delete all todo items first (cascade should handle this, but being explicit)
    await supabase
      .from('todo_items')
      .delete()
      .eq('todo_list_id', id);

    // Delete the todo list
    const { error } = await supabase
      .from('todo_lists')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Todo list deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete Todo List API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
