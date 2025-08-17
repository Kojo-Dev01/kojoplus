'use client';

import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  X, 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  Play, 
  Folder, 
  GripVertical,
  ChevronDown,
  ChevronRight,
  Clock,
  Video,
  Eye,
  EyeOff,
  ChevronUp,
  PlayCircle,
  FolderPlus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import CreateModuleModal from './CreateModuleModal';
import CreateSectionModal from './CreateSectionModal';
import CreateLessonModal from './CreateLessonModal';
import EditModuleModal from './EditModuleModal';
import EditSectionModal from './EditSectionModal';
import EditLessonModal from './EditLessonModal';
import LessonDetailsModal from './LessonDetailsModal';

const ItemTypes = {
  CONTENT_ITEM: 'content_item'
};

// Draggable wrapper for content items
const DraggableItem = ({ children, id, index, type, moduleId, onMove }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CONTENT_ITEM,
    item: { id, index, type, moduleId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.CONTENT_ITEM,
    hover(draggedItem) {
      if (draggedItem.moduleId === moduleId && draggedItem.index !== index) {
        onMove(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <div ref={(node) => drag(drop(node))} className={`${isDragging ? 'opacity-50' : ''}`}>
      {children}
    </div>
  );
};

export default function ManageModulesModal({ isOpen, onClose, course, onSuccess }) {
  // All state hooks declared at the top, unconditionally
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedModule, setSelectedModule] = useState(null);
  const [showCreateModuleModal, setShowCreateModuleModal] = useState(false);
  const [showCreateSectionModal, setShowCreateSectionModal] = useState(false);
  const [showCreateLessonModal, setShowCreateLessonModal] = useState(false);
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  // New state for edit modals
  const [showEditModuleModal, setShowEditModuleModal] = useState(false);
  const [showEditSectionModal, setShowEditSectionModal] = useState(false);
  const [showEditLessonModal, setShowEditLessonModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [selectedSectionForEdit, setSelectedSectionForEdit] = useState(null);

  // New state for lesson details modal
  const [showLessonDetailsModal, setShowLessonDetailsModal] = useState(false);
  const [selectedLessonForDetails, setSelectedLessonForDetails] = useState(null);
  const [selectedModuleForDetails, setSelectedModuleForDetails] = useState(null);
  const [selectedSectionForDetails, setSelectedSectionForDetails] = useState(null);

  const { secureApiCall } = useAuth();

  // Fetch modules function
  const fetchModules = async () => {
    if (!course?._id) return;
    
    try {
      setLoading(true);
      setError('');

      const response = await secureApiCall(`/api/admin/courses/${course._id}`);

      if (response.ok) {
        const data = await response.json();
        setModules(data.course.modules || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch modules');
      }
    } catch (error) {
      if (error.message !== 'Authentication expired') {
        setError('Failed to fetch modules');
        console.error('Error fetching modules:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch modules when component opens or course changes
  useEffect(() => {
    if (isOpen && course?._id) {
      fetchModules();
    }
  }, [isOpen, course?._id]);

  // Handle content reordering within a module
  const handleMoveContent = async (moduleId, fromIndex, toIndex) => {
    console.log('=== DRAG & DROP REORDER ===');
    console.log(`Module ID: ${moduleId}`);
    console.log(`Moving item from index ${fromIndex} to ${toIndex}`);
    
    const moduleIndex = modules.findIndex(m => m._id === moduleId);
    if (moduleIndex === -1) {
      console.error('❌ Module not found in modules array');
      return;
    }

    const module2 = modules[moduleIndex];
    console.log(`📁 Module: "${module.title}"`);
    
    const contentItems = [];
    
    // Create combined content array (sections + lessons) with proper sorting
    if (module2.sections) {
      module2.sections.forEach(section => {
        contentItems.push({ 
          ...section, 
          type: 'section',
          order: section.order || 999
        });
      });
    }
    if (module2.lessons) {
      module2.lessons.forEach(lesson => {
        contentItems.push({ 
          ...lesson, 
          type: 'lesson',
          order: lesson.order || 999
        });
      });
    }

    // Sort by current order to maintain proper sequence
    contentItems.sort((a, b) => (a.order || 999) - (b.order || 999));
    
    console.log('📊 BEFORE REORDER:');
    contentItems.forEach((item, index) => {
      console.log(`  ${index}: "${item.title}" (${item.type}, order: ${item.order})`);
    });
    
    // Validate indices
    if (fromIndex < 0 || fromIndex >= contentItems.length || toIndex < 0 || toIndex >= contentItems.length) {
      console.error('❌ Invalid drag indices:', { fromIndex, toIndex, totalItems: contentItems.length });
      return;
    }

    const movedItem = contentItems[fromIndex];
    console.log(`🔄 Moving "${movedItem.title}" (${movedItem.type}) from position ${fromIndex} to ${toIndex}`);

    // Perform the reorder
    const [draggedItem] = contentItems.splice(fromIndex, 1);
    contentItems.splice(toIndex, 0, draggedItem);

    console.log('📊 AFTER REORDER:');
    contentItems.forEach((item, index) => {
      console.log(`  ${index}: "${item.title}" (${item.type})`);
    });

    // Create ordered items array with continuous sequential numbering
    const orderedItems = contentItems.map((item, index) => {
      const sequentialOrder = index + 1;
      console.log(`📌 Item "${item.title}" will get order: ${sequentialOrder}`);
      
      return {
        _id: item._id,
        title: item.title,
        type: item.type,
        order: sequentialOrder,
        // Include other necessary fields but strip out Mongoose-specific fields
        ...(item.description && { description: item.description }),
        ...(item.isPublished !== undefined && { isPublished: item.isPublished }),
        ...(item.lessons && { lessons: item.lessons }),
        ...(item.duration && { duration: item.duration }),
        ...(item.videoUrl && { videoUrl: item.videoUrl })
      };
    });

    console.log(`📤 Sending ${orderedItems.length} ordered items to API`);

    // Update local state immediately with optimistic update
    const updatedSections = orderedItems
      .filter(item => item.type === 'section')
      .map(({ type, ...section }) => section);
    
    const updatedLessons = orderedItems
      .filter(item => item.type === 'lesson')
      .map(({ type, ...lesson }) => lesson);

    const newModules = [...modules];
    newModules[moduleIndex] = {
      ...module,
      sections: updatedSections,
      lessons: updatedLessons
    };
    setModules(newModules);
    console.log('✅ Local state updated optimistically');

    // Debounce the API call to prevent too many requests
    if (window.reorderTimeout) {
      clearTimeout(window.reorderTimeout);
      console.log('🔄 Clearing previous timeout');
    }

    window.reorderTimeout = setTimeout(async () => {
      try {
        console.log('📡 Sending reorder request to API...');
        
        const response = await secureApiCall(`/api/admin/courses/${course._id}/modules/${moduleId}/reorder`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderedItems: orderedItems
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Reorder API response successful');
          console.log('📊 API Stats:', data.stats);
          
          // Update modules with fresh data from server to ensure consistency
          setModules(data.course.modules);
          console.log('✅ Updated local state with server data');
          
          onSuccess();
        } else {
          const errorData = await response.json();
          console.error('❌ API response error:', errorData);
          // Revert local changes on failure
          fetchModules();
        }
      } catch (error) {
        console.error('❌ Network error during reorder:', error);
        // Revert local changes on failure
        fetchModules();
      }
    }, 1000); // Wait 1 second after last drag operation
  };

  // Handle section lesson reordering with arrows
  const handleMoveSectionLessonByArrow = async (moduleId, sectionId, lessonIndex, direction) => {
    console.log('=== SECTION LESSON ARROW REORDER ===');
    console.log(`Module ID: ${moduleId}, Section ID: ${sectionId}`);
    console.log(`Moving lesson at index ${lessonIndex} ${direction}`);
    
    const moduleIndex = modules.findIndex(m => m._id === moduleId);
    if (moduleIndex === -1) {
      console.error('❌ Module not found in modules array');
      return;
    }

    const module2 = modules[moduleIndex];
    const section = module2.sections?.find(s => s._id === sectionId);
    if (!section) {
      console.error('❌ Section not found in module');
      return;
    }

    console.log(`📁 Module: "${module2.title}", Section: "${section.title}"`);
    
    // Get current lessons and sort them by order
    const currentLessons = section.lessons || [];
    const sortedLessons = [...currentLessons].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    console.log('📊 BEFORE REORDER:');
    sortedLessons.forEach((lesson, index) => {
      console.log(`  ${index}: "${lesson.title}" (order: ${lesson.order || 'undefined'})`);
    });
    
    // Calculate new position
    const newIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
    
    // Validate the move
    if (newIndex < 0 || newIndex >= sortedLessons.length) {
      console.log(`❌ Cannot move ${direction}: already at ${direction === 'up' ? 'top' : 'bottom'}`);
      return;
    }

    const movedLesson = sortedLessons[lessonIndex];
    console.log(`🔄 Moving lesson "${movedLesson.title}" from position ${lessonIndex} to ${newIndex}`);

    // Perform the reorder by swapping
    [sortedLessons[lessonIndex], sortedLessons[newIndex]] = [sortedLessons[newIndex], sortedLessons[lessonIndex]];

    console.log('📊 AFTER REORDER:');
    sortedLessons.forEach((lesson, index) => {
      console.log(`  ${index}: "${lesson.title}"`);
    });

    // Update orders sequentially starting from 1
    const reorderedLessons = sortedLessons.map((lesson, index) => {
      const newOrder = index + 1;
      console.log(`📌 Setting lesson "${lesson.title}" order to ${newOrder}`);
      return {
        ...lesson,
        order: newOrder
      };
    });

    console.log(`📤 Sending ${reorderedLessons.length} lessons to API for section reordering`);

    // Update local state immediately with optimistic update
    const newModules = [...modules];
    const updatedSection = {
      ...section,
      lessons: reorderedLessons
    };
    
    const sectionIndex = newModules[moduleIndex].sections.findIndex(s => s._id === sectionId);
    newModules[moduleIndex].sections[sectionIndex] = updatedSection;
    setModules(newModules);
    console.log('✅ Local state updated optimistically for section lessons');

    try {
      console.log('📡 Sending section lesson reorder request to API...');
      
      const response = await secureApiCall(`/api/admin/courses/${course._id}/modules/${moduleId}/sections/${sectionId}/reorder-lessons`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessons: reorderedLessons
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Section lesson reorder API response successful');
        console.log('📊 API Stats:', data.stats);
        
        // Update modules with fresh data from server to ensure consistency
        setModules(data.course.modules);
        console.log('✅ Updated local state with server data');
        
        onSuccess();
      } else {
        const errorData = await response.json();
        console.error('❌ Section lesson reorder API response error:', errorData);
        // Revert local changes on failure
        fetchModules();
      }
    } catch (error) {
      console.error('❌ Network error during section lesson reorder:', error);
      // Revert local changes on failure
      fetchModules();
    }
  };

  // Calculate lesson number for display with improved logic
  const calculateLessonNumber = (moduleIndex, contentIndex) => {
    console.log(`🔢 Calculating lesson number for module ${moduleIndex}, content ${contentIndex}`);
    
    let lessonNumber = 1;
    
    // Add lessons from previous modules
    for (let i = 0; i < moduleIndex; i++) {
      const prevModule = modules[i];
      if (prevModule.lessons) {
        lessonNumber += prevModule.lessons.length;
        console.log(`  Added ${prevModule.lessons.length} direct lessons from module ${i}`);
      }
      if (prevModule.sections) {
        prevModule.sections.forEach(section => {
          if (section.lessons) {
            lessonNumber += section.lessons.length;
            console.log(`  Added ${section.lessons.length} section lessons from module ${i}`);
          }
        });
      }
    }

    // Add lessons from current module before this content
    const currentModule = modules[moduleIndex];
    const contentItems = [];
    
    if (currentModule.sections) {
      currentModule.sections.forEach(section => {
        contentItems.push({ ...section, type: 'section' });
      });
    }
    if (currentModule.lessons) {
      currentModule.lessons.forEach(lesson => {
        contentItems.push({ ...lesson, type: 'lesson' });
      });
    }

    // Sort by order for accurate calculation
    contentItems.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    for (let i = 0; i < contentIndex; i++) {
      const item = contentItems[i];
      if (item.type === 'lesson') {
        lessonNumber++;
        console.log(`  Incremented for direct lesson: ${lessonNumber}`);
      } else if (item.type === 'section' && item.lessons) {
        lessonNumber += item.lessons.length;
        console.log(`  Added ${item.lessons.length} for section lessons: ${lessonNumber}`);
      }
    }

    console.log(`🔢 Final lesson number: ${lessonNumber}`);
    return lessonNumber;
  };

  // Calculate lesson number within section for display
  const calculateSectionLessonNumber = (moduleIndex, contentIndex, lessonIndex) => {
    console.log(`🔢 Calculating section lesson number for module ${moduleIndex}, content ${contentIndex}, lesson ${lessonIndex}`);
    
    let lessonNumber = 1;
    
    // Add lessons from previous modules
    for (let i = 0; i < moduleIndex; i++) {
      const prevModule = modules[i];
      if (prevModule.lessons) {
        lessonNumber += prevModule.lessons.length;
        console.log(`  Added ${prevModule.lessons.length} direct lessons from module ${i}`);
      }
      if (prevModule.sections) {
        prevModule.sections.forEach(section => {
          if (section.lessons) {
            lessonNumber += section.lessons.length;
            console.log(`  Added ${section.lessons.length} section lessons from module ${i}`);
          }
        });
      }
    }

    // Add lessons from current module before this content
    const currentModule = modules[moduleIndex];
    const contentItems = [];
    
    // Build content items array with proper type information
    if (currentModule.sections) {
      currentModule.sections.forEach(section => {
        contentItems.push({ 
          ...section, 
          type: 'section',
          order: section.order || 999 
        });
      });
    }
    if (currentModule.lessons) {
      currentModule.lessons.forEach(lesson => {
        contentItems.push({ 
          ...lesson, 
          type: 'lesson',
          order: lesson.order || 999 
        });
      });
    }

    // Sort by order for accurate calculation
    contentItems.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Add lessons from content items before the current section
    for (let i = 0; i < contentIndex; i++) {
      const item = contentItems[i];
      
      // Ensure item exists and has type property
      if (!item || !item.type) {
        console.warn(`⚠️ Item at index ${i} is missing or has no type property:`, item);
        continue;
      }
      
      if (item.type === 'lesson') {
        lessonNumber++;
        console.log(`  Incremented for direct lesson: ${lessonNumber}`);
      } else if (item.type === 'section' && item.lessons) {
        lessonNumber += item.lessons.length;
        console.log(`  Added ${item.lessons.length} for section lessons: ${lessonNumber}`);
      }
    }

    // Add lessons in current section before this lesson
    lessonNumber += lessonIndex;

    console.log(`🔢 Final section lesson number: ${lessonNumber}`);
    return lessonNumber;
  };

  // Toggle module expansion
  const toggleModule = (moduleId) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Handle delete with confirmation
  const handleDeleteClick = (item, type) => {
    setItemToDelete({ ...item, type });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      let endpoint = '';
      
      if (itemToDelete.type === 'section') {
        endpoint = `/api/admin/courses/${course._id}/modules/${selectedModule?._id}/sections/${itemToDelete._id}`;
      } else if (itemToDelete.type === 'lesson') {
        // Check if it's a section lesson or direct module lesson
        if (selectedSection) {
          endpoint = `/api/admin/courses/${course._id}/modules/${selectedModule?._id}/sections/${selectedSection._id}/lessons/${itemToDelete._id}`;
        } else {
          endpoint = `/api/admin/courses/${course._id}/modules/${selectedModule?._id}/lessons/${itemToDelete._id}`;
        }
      }

      const response = await secureApiCall(endpoint, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchModules(); // Refresh the modules list
        setShowDeleteConfirm(false);
        setItemToDelete(null);
        setSelectedSection(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete item');
    }
  };

  // Handle edit functions
  const handleEditModule = (module) => {
    setEditingModule(module);
    setShowEditModuleModal(true);
  };

  const handleEditSection = (module, section) => {
    setSelectedModule(module);
    setEditingSection(section);
    setShowEditSectionModal(true);
  };

  const handleEditLesson = (module, section, lesson) => {
    setSelectedModule(module);
    setSelectedSection(section); // null for direct module lessons
    setEditingLesson(lesson);
    setShowEditLessonModal(true);
  };

  // Handle view lesson details
  const handleViewLessonDetails = (module, section, lesson) => {
    setSelectedModuleForDetails(module);
    setSelectedSectionForDetails(section); // null for direct module lessons
    setSelectedLessonForDetails(lesson);
    setShowLessonDetailsModal(true);
  };

  // Early return after all hooks are declared
  if (!isOpen) return null;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Manage Course Content</h2>
                <p className="text-gray-600">{course?.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Add Module Button */}
            <div className="mb-6">
              <button
                onClick={() => setShowCreateModuleModal(true)}
                className="flex items-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Module</span>
              </button>
            </div>

            {/* Modules List */}
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : modules.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No modules yet</p>
                  <p className="text-sm">Create your first module to get started</p>
                </div>
              ) : (
                modules.map((module, moduleIndex) => {
                  const isExpanded = expandedModules.has(module._id);
                  
                  // Create combined content array for this module
                  const contentItems = [];
                  if (module.sections) {
                    module.sections.forEach(section => {
                      contentItems.push({ ...section, type: 'section' });
                    });
                  }
                  if (module.lessons) {
                    module.lessons.forEach(lesson => {
                      contentItems.push({ ...lesson, type: 'lesson' });
                    });
                  }
                  contentItems.sort((a, b) => (a.order || 0) - (b.order || 0));

                  return (
                    <div key={module._id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Module Header */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleModule(module._id)}
                            className="flex items-center"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-600" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-600" />
                            )}
                          </button>
                          
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">{moduleIndex + 1}</span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {module.title}
                            </h3>
                            {module.description && (
                              <p className="text-sm text-gray-600 truncate mt-1">
                                {module.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-gray-500">
                            {contentItems.length} items
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedModule(module);
                                setShowCreateSectionModal(true);
                              }}
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                              title="Add Section"
                            >
                              <Plus className="w-4 h-4" />
                              <span> Section</span>
                            </button>
                            
                            <button
                              onClick={() => {
                                setSelectedModule(module);
                                setShowCreateLessonModal(true);
                              }}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                              title="Add Lesson"
                            >
                              <Plus className="w-4 h-4" />
                              <span> Lesson</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Module Content */}
                      {isExpanded && (
                        <div className="p-4 bg-white border-t border-gray-200">
                          {contentItems.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <BookOpen className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                              <p className="text-sm">No content in this module</p>
                              <p className="text-xs">Add sections and lessons to organize your content</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-xs text-gray-500 mb-3 flex items-center">
                                <GripVertical className="w-3 h-3 mr-1" />
                                Drag items to reorder content within this module
                              </div>
                              
                              {contentItems.map((item, index) => {
                                const lessonNumber = calculateLessonNumber(moduleIndex, index);
                                
                                return (
                                  <DraggableItem
                                    key={`${item._id}-${item.order || index}`} // Add order to key for proper re-rendering
                                    id={item._id}
                                    index={index}
                                    type={item.type}
                                    moduleId={module._id}
                                    onMove={(fromIndex, toIndex) => {
                                      console.log(`🎯 Drag event: ${fromIndex} → ${toIndex}`);
                                      handleMoveContent(module._id, fromIndex, toIndex);
                                    }}
                                  >
                                    {item.type === 'section' ? (
                                      // Section Item with improved styling
                                      <div className="border border-gray-300 rounded-lg mb-2 bg-gray-50">
                                        <div className="flex items-center p-4 hover:bg-gray-100 transition-colors">
                                          <GripVertical className="w-4 h-4 text-gray-400 mr-3 cursor-grab" />
                                          
                                          <button
                                            onClick={() => toggleSection(item._id)}
                                            className="flex items-center mr-3"
                                          >
                                            {expandedSections.has(item._id) ? (
                                              <ChevronDown className="w-4 h-4 text-gray-600" />
                                            ) : (
                                              <ChevronRight className="w-4 h-4 text-gray-600" />
                                            )}
                                          </button>

                                          {/* Section indicator with improved styling */}
                                          <div className="flex items-center mr-3">
                                            <div className="w-6 h-6 bg-gray-700 text-white rounded-md flex items-center justify-center mr-2">
                                              <span className="text-xs font-bold">{index + 1}</span>
                                            </div>
                                            <div className="px-2 py-1 bg-gray-600 text-white rounded-md text-xs font-medium">
                                              SECTION
                                            </div>
                                          </div>

                                          <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                                              {item.title}
                                            </h4>
                                            <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                                              <span>Order: {item.order || 'unset'}</span>
                                              <span>{item.lessons?.length || 0} lessons</span>
                                            </div>
                                          </div>

                                          <div className="flex items-center space-x-2">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditSection(module, item);
                                              }}
                                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                              title="Edit Section"
                                            >
                                              <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick(item, 'section');
                                              }}
                                              className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
                                              title="Delete Section"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Section Lessons with improved hierarchy */}
                                        {/* {expandedSections.has(item._id) && item.lessons && item.lessons.length > 0 && (
                                          <div className="bg-white border-t border-gray-200">
                                            <div className="pl-8 border-l-2 border-gray-300 ml-6">
                                              {item.lessons
                                                .sort((a, b) => (a.order || 0) - (b.order || 0))
                                                .map((lesson, lessonIndex) => (
                                                  <div key={lesson._id} className="border-b border-gray-100 last:border-b-0">
                                                    <div className="flex items-center p-3 hover:bg-gray-50 transition-colors">
                                                      <div className="w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center mr-3">
                                                        <span className="text-xs font-bold">{lessonNumber + lessonIndex}</span>
                                                      </div>
                                                      
                                                      <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                                        <Play className="w-3 h-3 text-gray-600" />
                                                      </div>

                                                      <div className="flex-1 min-w-0">
                                                        <h5 className="text-sm font-medium text-gray-900 truncate">
                                                          {lesson.title}
                                                        </h5>
                                                        <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                                                          <span>Order: {lesson.order || 'unset'}</span>
                                                          {lesson.duration && (
                                                            <div className="flex items-center">
                                                              <Clock className="w-3 h-3 mr-1" />
                                                              <span>{lesson.duration}min</span>
                                                            </div>
                                                          )}
                                                          {lesson.videoUrl && (
                                                            <Video className="w-3 h-3 text-gray-500" />
                                                          )}
                                                          <div className={`px-2 py-1 rounded-full font-medium ${
                                                            lesson.isPublished 
                                                              ? 'bg-gray-200 text-gray-800' 
                                                              : 'bg-gray-100 text-gray-600'
                                                          }`}>
                                                            {lesson.isPublished ? 'Published' : 'Draft'}
                                                          </div>
                                                        </div>
                                                      </div>

                                                      <div className="flex items-center space-x-2">
                                                        <button
                                                          onClick={() => console.log('Edit lesson:', lesson)}
                                                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                                          title="Edit Lesson"
                                                        >
                                                          <Edit className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                          onClick={() => handleDeleteClick(lesson, 'lesson')}
                                                          className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                                                          title="Delete Lesson"
                                                        >
                                                          <Trash2 className="w-3 h-3" />
                                                        </button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                            </div>
                                            
                                            <div className="pl-8 ml-6 p-3 border-t border-gray-100">
                                              <button
                                                onClick={() => {
                                                  setSelectedModule(module);
                                                  setSelectedSection(item);
                                                  setShowCreateLessonModal(true);
                                                }}
                                                className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                              >
                                                <Plus className="w-4 h-4" />
                                                <span>Add Lesson to Section</span>
                                              </button>
                                            </div>
                                          </div>
                                        )} */}
                                        
                                        {/* Section Lessons with Arrow-Based Reordering - REPLACE DUPLICATE DISPLAY */}
                                        {expandedSections.has(item._id) && item.lessons && item.lessons.length > 0 && (
                                          <div className="bg-white border-t border-gray-200">
                                            <div className="pl-8 border-l-2 border-gray-300 ml-6">
                                              <div className="text-xs text-gray-500 mb-3 pt-3 flex items-center">
                                                <ChevronUp className="w-3 h-3 mr-1" />
                                                <ChevronDown className="w-3 h-3 mr-1" />
                                                Use arrows to reorder lessons within this section
                                              </div>
                                              
                                              {item.lessons
                                                .sort((a, b) => (a.order || 0) - (b.order || 0))
                                                .map((lesson, lessonIndex) => (
                                                  <div
                                                    key={`section-lesson-${lesson._id}-${lesson.order || lessonIndex}`}
                                                    className="border-b border-gray-100 last:border-b-0"
                                                  >
                                                    <div className="flex items-center p-3 hover:bg-gray-50 transition-colors">
                                                      {/* Reorder Arrows */}
                                                      <div className="flex flex-col mr-3">
                                                        <button
                                                          onClick={() => handleMoveSectionLessonByArrow(module._id, item._id, lessonIndex, 'up')}
                                                          disabled={lessonIndex === 0}
                                                          className={`p-1 rounded transition-colors ${
                                                            lessonIndex === 0 
                                                              ? 'text-gray-300 cursor-not-allowed' 
                                                              : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                                                          }`}
                                                          title={lessonIndex === 0 ? 'Already at top' : 'Move up'}
                                                        >
                                                          <ChevronUp className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                          onClick={() => handleMoveSectionLessonByArrow(module._id, item._id, lessonIndex, 'down')}
                                                          disabled={lessonIndex === item.lessons.length - 1}
                                                          className={`p-1 rounded transition-colors ${
                                                            lessonIndex === item.lessons.length - 1 
                                                              ? 'text-gray-300 cursor-not-allowed' 
                                                              : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                                                          }`}
                                                          title={lessonIndex === item.lessons.length - 1 ? 'Already at bottom' : 'Move down'}
                                                        >
                                                          <ChevronDown className="w-4 h-4" />
                                                        </button>
                                                      </div>
                                                      
                                                      {/* Lesson number with improved styling */}
                                                      <div className="w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center mr-3">
                                                        <span className="text-xs font-bold">
                                                          {(() => {
                                                            try {
                                                              return calculateSectionLessonNumber(moduleIndex, index, lessonIndex);
                                                            } catch (error) {
                                                              console.error('Error calculating section lesson number:', error);
                                                              return '?';
                                                            }
                                                          })()}
                                                        </span>
                                                      </div>
                                                      
                                                      <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                                        <Play className="w-3 h-3 text-gray-600" />
                                                      </div>

                                                      <div className="flex-1 min-w-0">
                                                        <h5 className="text-sm font-medium text-gray-900 truncate">
                                                          {lesson.title}
                                                        </h5>
                                                        <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                                                          <span>Order: {lesson.order || 'unset'}</span>
                                                          <span>Position: {lessonIndex + 1} of {item.lessons.length}</span>
                                                          {lesson.duration && (
                                                            <div className="flex items-center">
                                                              <Clock className="w-3 h-3 mr-1" />
                                                              <span>{lesson.duration}min</span>
                                                            </div>
                                                          )}
                                                          {lesson.videoUrl && (
                                                            <Video className="w-3 h-3 text-gray-500" />
                                                          )}
                                                          <div className={`px-2 py-1 rounded-full font-medium ${
                                                            lesson.isPublished 
                                                              ? 'bg-gray-200 text-gray-800' 
                                                              : 'bg-gray-100 text-gray-600'
                                                          }`}>
                                                            {lesson.isPublished ? 'Published' : 'Draft'}
                                                          </div>
                                                        </div>
                                                      </div>

                                                      <div className="flex items-center space-x-2">
                                                        <button
                                                          onClick={() => handleViewLessonDetails(module, item, lesson)}
                                                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                          title="View Lesson"
                                                        >
                                                          <Eye className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                          onClick={() => handleEditLesson(module, item, lesson)}
                                                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                                          title="Edit Lesson"
                                                        >
                                                          <Edit className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                          onClick={() => handleDeleteClick(lesson, 'lesson')}
                                                          className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                                                          title="Delete Lesson"
                                                        >
                                                          <Trash2 className="w-3 h-3" />
                                                        </button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                            </div>
                                            
                                            {/* Add Lesson to Section Button */}
                                            <div className="pl-8 ml-6 p-3 border-t border-gray-100">
                                              <button
                                                onClick={() => {
                                                  setSelectedModule(module);
                                                  setSelectedSection(item);
                                                  setShowCreateLessonModal(true);
                                                }}
                                                className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                              >
                                                <Plus className="w-4 h-4" />
                                                <span>Add Lesson to Section</span>
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      
                                        {/* Show "Add Lesson" button even when section is empty */}
                                        {expandedSections.has(item._id) && (!item.lessons || item.lessons.length === 0) && (
                                          <div className="bg-white border-t border-gray-200">
                                            <div className="pl-8 ml-6 p-3">
                                              <div className="text-center py-4 text-gray-500">
                                                <Play className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                                <p className="text-sm">No lessons in this section</p>
                                              </div>
                                              <button
                                                onClick={() => {
                                                  setSelectedModule(module);
                                                  setSelectedSection(item);
                                                  setShowCreateLessonModal(true);
                                                }}
                                                className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors w-full justify-center"
                                              >
                                                <Plus className="w-4 h-4" />
                                                <span>Add First Lesson</span>
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      // Direct Lesson Item with improved styling
                                      <div className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-300 rounded-lg">
                                        <GripVertical className="w-4 h-4 text-gray-400 mr-3 cursor-grab" />

                                        {/* Lesson number with consistent styling */}
                                        <div className="w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center mr-3">
                                          <span className="text-xs font-bold">{lessonNumber}</span>
                                        </div>
                                        
                                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                          <Play className="w-3 h-3 text-gray-600" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                                            {item.title}
                                          </h4>
                                          <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                                            <span>Order: {item.order || 'unset'}</span>
                                            {item.duration && (
                                              <div className="flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                <span>{item.duration}min</span>
                                              </div>
                                            )}
                                            {item.videoUrl && (
                                              <Video className="w-3 h-3 text-gray-500" />
                                            )}
                                            <div className={`px-2 py-1 rounded-full font-medium ${
                                              item.isPublished 
                                                ? 'bg-gray-200 text-gray-800' 
                                                : 'bg-gray-100 text-gray-600'
                                            }`}>
                                              {item.isPublished ? 'Published' : 'Draft'}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                          <button
                                            onClick={() => handleViewLessonDetails(module, null, item)}
                                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                            title="View Lesson"
                                          >
                                            <Eye className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => handleEditLesson(module, null, item)}
                                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                            title="Edit Lesson"
                                          >
                                            <Edit className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteClick(item, 'lesson')}
                                            className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
                                            title="Delete Lesson"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </DraggableItem>
                                );
                              })}
                            </div>
                          )}

                          {/* Module Summary with improved styling */}
                          <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-900">Module Summary</span>
                              <div className="flex items-center space-x-4 text-gray-700">
                                <span>{contentItems.filter(item => item.type === 'section').length} sections</span>
                                <span>{contentItems.filter(item => item.type === 'lesson').length} direct lessons</span>
                                <span>{(() => {
                                  // Calculate total lessons in this module
                                  let totalLessons = 0;
                                  contentItems.forEach(item => {
                                    if (item.type === 'lesson') {
                                      totalLessons++;
                                    } else if (item.type === 'section' && item.lessons) {
                                      totalLessons += item.lessons.length;
                                    }
                                  });
                                  return totalLessons;
                                })()} total lessons</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })
                )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              {modules.length} modules • Drag items to reorder content within modules
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Sub-modals */}
        <CreateModuleModal
          isOpen={showCreateModuleModal}
          onClose={() => setShowCreateModuleModal(false)}
          courseId={course?._id}
          onSuccess={() => {
            setShowCreateModuleModal(false);
            fetchModules();
          }}
        />

        <CreateSectionModal
          isOpen={showCreateSectionModal}
          onClose={() => setShowCreateSectionModal(false)}
          courseId={course?._id}
          moduleId={selectedModule?._id}
          onSuccess={() => {
            setShowCreateSectionModal(false);
            fetchModules();
          }}
        />

        <CreateLessonModal
          isOpen={showCreateLessonModal}
          onClose={() => {
            setShowCreateLessonModal(false);
            setSelectedSection(null);
          }}
          courseId={course?._id}
          moduleId={selectedModule?._id}
          sectionId={selectedSection?._id} // Pass section ID for section lessons
          onSuccess={() => {
            setShowCreateLessonModal(false);
            setSelectedSection(null);
            fetchModules();
          }}
        />

        {/* Edit Module Modal */}
        <EditModuleModal
          isOpen={showEditModuleModal}
          onClose={() => {
            setShowEditModuleModal(false);
            setEditingModule(null);
          }}
          courseId={course?._id}
          module={editingModule}
          onSuccess={() => {
            setShowEditModuleModal(false);
            setEditingModule(null);
            fetchModules();
          }}
        />

        {/* Edit Section Modal */}
        <EditSectionModal
          isOpen={showEditSectionModal}
          onClose={() => {
            console.log('Closing edit section modal');
            setShowEditSectionModal(false);
            setSelectedModule(null);           
             setEditingSection(null);
            setSelectedSectionForEdit(null);
          }}
          courseId={course?._id}
          moduleId={selectedModule?._id}
          section={editingSection}
          onSuccess={() => {
            console.log('Section updated successfully');
            setShowEditSectionModal(false);
            setSelectedModule(null);            
            setEditingSection(null);
            setSelectedSectionForEdit(null);
            fetchModules();
            onSuccess(); // Notify parent component
          }}
        />

        {/* Edit Lesson Modal */}
        <EditLessonModal
          isOpen={showEditLessonModal}
          onClose={() => {
            setShowEditLessonModal(false);
            setSelectedModule(null);
            setSelectedSection(null);
            setEditingLesson(null);
          }}
          courseId={course?._id}
          moduleId={selectedModule?._id}
          sectionId={selectedSection?._id} // null for direct module lessons
          lesson={editingLesson}
          onSuccess={() => {
            setShowEditLessonModal(false);
            setSelectedModule(null);
            setSelectedSection(null);
            setEditingLesson(null);
            fetchModules();
          }}
        />

        {/* Lesson Details Modal */}
        <LessonDetailsModal
          isOpen={showLessonDetailsModal}
          onClose={() => {
            setShowLessonDetailsModal(false);
            setSelectedLessonForDetails(null);
            setSelectedModuleForDetails(null);
            setSelectedSectionForDetails(null);
          }}
          lesson={selectedLessonForDetails}
          module={selectedModuleForDetails}
          section={selectedSectionForDetails}
          onEdit={() => {
            // Switch to edit mode
            setSelectedModule(selectedModuleForDetails);
            setSelectedSection(selectedSectionForDetails);
            setEditingLesson(selectedLessonForDetails);
            setShowEditLessonModal(true);
          }}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}
