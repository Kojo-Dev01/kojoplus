'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, FolderOpen, Play, Clock, Video, Eye, EyeOff, BookOpen } from 'lucide-react';

export default function CourseContentTab({ course }) {
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState(new Set());

  const toggleModule = (moduleId) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const calculateLessonNumber = (moduleIndex, contentIndex) => {
    let lessonNumber = 1;
    
    // Add lessons from previous modules
    for (let i = 0; i < moduleIndex; i++) {
      const prevModule = course.modules[i];
      if (prevModule.lessons) {
        lessonNumber += prevModule.lessons.length;
      }
      if (prevModule.sections) {
        prevModule.sections.forEach(section => {
          if (section.lessons) {
            lessonNumber += section.lessons.length;
          }
        });
      }
    }

    // Add lessons from current module before this content
    const currentModule = course.modules[moduleIndex];
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

    contentItems.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    for (let i = 0; i < contentIndex; i++) {
      const item = contentItems[i];
      if (item.type === 'lesson') {
        lessonNumber++;
      } else if (item.type === 'section' && item.lessons) {
        lessonNumber += item.lessons.length;
      }
    }

    return lessonNumber;
  };

  if (!course.modules || course.modules.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Available</h3>
        <p className="text-gray-600">This course doesn&apos;t have any modules or content yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {course.modules.map((module, moduleIndex) => {
        const isModuleExpanded = expandedModules.has(module._id);
        
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
            <div 
              className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => toggleModule(module._id)}
            >
              <div className="flex items-center space-x-3">
                {isModuleExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                )}
                
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
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  module.isPublished 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {module.isPublished ? 'Published' : 'Draft'}
                </div>
              </div>
            </div>

            {/* Module Content */}
            {isModuleExpanded && (
              <div className="p-4 bg-white border-t border-gray-200">
                {contentItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No content in this module</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contentItems.map((item, index) => {
                      const lessonNumber = calculateLessonNumber(moduleIndex, index);
                      
                      return (
                        <div key={`${item._id}-${item.order || index}`}>
                          {item.type === 'section' ? (
                            // Section Item
                            <div className="border border-gray-300 rounded-lg mb-2 bg-gray-50">
                              <div 
                                className="flex items-center p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                                onClick={() => toggleSection(item._id)}
                              >
                                {expandedSections.has(item._id) ? (
                                  <ChevronDown className="w-4 h-4 text-gray-600 mr-3" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-600 mr-3" />
                                )}

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
                                    <div className={`px-2 py-1 rounded-full font-medium ${
                                      item.isPublished 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {item.isPublished ? 'Published' : 'Draft'}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Section Lessons */}
                              {expandedSections.has(item._id) && item.lessons && item.lessons.length > 0 && (
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
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                  {lesson.isPublished ? 'Published' : 'Draft'}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}

                              {/* Empty section message */}
                              {expandedSections.has(item._id) && (!item.lessons || item.lessons.length === 0) && (
                                <div className="bg-white border-t border-gray-200">
                                  <div className="pl-8 ml-6 p-3">
                                    <div className="text-center py-4 text-gray-500">
                                      <Play className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                      <p className="text-sm">No lessons in this section</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            // Direct Lesson Item
                            <div className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-300 rounded-lg">
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
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {item.isPublished ? 'Published' : 'Draft'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
