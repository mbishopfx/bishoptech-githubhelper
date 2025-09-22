import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT - Update todo item (toggle completion, update status, etc.)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const { data: todoItem, error } = await supabase
      .from('todo_items')
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
      message: 'Todo item updated successfully',
      todoItem
    });

  } catch (error: any) {
    console.error('Update Todo Item API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Delete todo item
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from('todo_items')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Todo item deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete Todo Item API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Add new todo item to existing list
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { todo_list_id, title, description, priority = 'medium' } = await request.json();

    const { data: todoItem, error } = await supabase
      .from('todo_items')
      .insert({
        todo_list_id: todo_list_id,
        title,
        description: description || '',
        priority,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Todo item created successfully',
      todoItem
    });

  } catch (error: any) {
    console.error('Create Todo Item API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
