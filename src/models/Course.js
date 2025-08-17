import mongoose from 'mongoose';

// Lesson Schema (for actual video content)
const LessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  videoUrl: {
    type: String,
    trim: true
  },
  videoKey: {
    type: String, // For Wasabi storage key
    trim: true
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  order: {
    type: Number,
    required: true,
    default: 1
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Section Schema (optional container for lessons)
const SectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  order: {
    type: Number,
    required: true,
    default: 1
  },
  lessons: [LessonSchema], // Lessons within this section
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Module Schema (main container)
const ModuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  order: {
    type: Number,
    required: true,
    default: 1
  },
  sections: [SectionSchema], // Optional sections for organizing lessons
  lessons: [LessonSchema], // Direct lessons in module (not in sections)
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxLength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: false,
    trim: true,
    lowercase: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    trim: true,
    maxLength: [5000, 'Description cannot exceed 5000 characters']
  },
  shortDescription: {
    type: String,
    trim: true,
    maxLength: [500, 'Short description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'beginner', 'intermediate', 'advanced', 'trading-basics',
      'technical-analysis', 'fundamental-analysis', 'risk-management',
      'psychology', 'strategies', 'tools', 'market-analysis', 'general'
    ],
    default: 'general'
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    enum: [
      'forex-fundamentals', 'technical-analysis', 'trading-strategies',
      'risk-management', 'market-psychology', 'advanced-concepts',
      'tools-and-platforms', 'live-trading', 'general'
    ],
    default: 'general'
  },
  level: {
    type: String,
    required: [true, 'Level is required'],
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  instructor: {
    type: String,
    required: [true, 'Instructor is required'],
    trim: true,
    default: 'Kojo Team'
  },
  
  // Course Type and Pricing
  courseType: {
    type: String,
    enum: ['free', 'paid'],
    default: 'free',
    required: true
  },
  price: {
    type: Number,
    default: 0,
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(value) {
        // If course is paid, price must be greater than 0
        if (this.courseType === 'paid' && value <= 0) {
          return false;
        }
        // If course is free, price should be 0
        if (this.courseType === 'free' && value > 0) {
          return false;
        }
        return true;
      },
      message: 'Price must be greater than 0 for paid courses and 0 for free courses'
    }
  },
  productId: {
    type: String,
    trim: true,
    validate: {
      validator: function(value) {
        // Product ID is required for paid courses
        if (this.courseType === 'paid') {
          return value && value.trim().length > 0;
        }
        return true;
      },
      message: 'Product ID is required for paid courses'
    },
    index: true
  },
  purchaseLink: {
    type: String,
    trim: true,
    validate: {
      validator: function(value) {
        // Purchase link is required for paid courses
        if (this.courseType === 'paid') {
          return value && value.trim().length > 0;
        }
        return true;
      },
      message: 'Purchase link is required for paid courses'
    }
  },
  
  // Existing fields
  isPremium: {
    type: Boolean,
    default: false
  },
  accessLevel: {
    type: String,
    enum: ['public', 'members', 'premium', 'admin'],
    default: 'public'
  },
  isPublished: {
    type: Boolean,
    default: false,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Media
  thumbnailUrl: {
    type: String,
    trim: true
  },
  thumbnailKey: {
    type: String,
    trim: true
  },
  introVideoUrl: {
    type: String,
    trim: true
  },
  introVideoKey: {
    type: String,
    trim: true
  },
  
  // Course Content - New Structure
  modules: [ModuleSchema],
  
  // Course Metadata
  tags: [{
    type: String,
    trim: true
  }],
  prerequisites: [{
    type: String,
    trim: true
  }],
  learningOutcomes: [{
    type: String,
    trim: true
  }],
  
  // Statistics
  enrollments: {
    type: Number,
    default: 0,
    min: 0
  },
  completions: {
    type: Number,
    default: 0,
    min: 0
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Computed fields
  totalDuration: {
    type: Number, // in minutes
    default: 0
  },
  totalModules: {
    type: Number,
    default: 0
  },
  totalSections: {
    type: Number,
    default: 0
  },
  totalLessons: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
CourseSchema.index({ title: 'text', description: 'text', tags: 'text' });
CourseSchema.index({ category: 1, level: 1 });
CourseSchema.index({ isPublished: 1, isFeatured: 1 });
CourseSchema.index({ courseType: 1, price: 1 });
CourseSchema.index({ productId: 1 }, { sparse: true });
CourseSchema.index({ slug: 1 }, { unique: false });
CourseSchema.index({ createdAt: -1 });

// Virtual fields
CourseSchema.virtual('completionRate').get(function() {
  if (this.enrollments === 0) return 0;
  return Math.round((this.completions / this.enrollments) * 100);
});

CourseSchema.virtual('formattedPrice').get(function() {
  if (this.courseType === 'free' || this.price === 0) {
    return 'Free';
  }
  return `$${this.price.toFixed(2)}`;
});

// Generate slug from title
CourseSchema.methods.generateSlug = function() {
  if (!this.title) {
    // If no title, generate a random slug
    this.slug = `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return;
  }
  
  let baseSlug = this.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  // If slug is empty after cleaning, generate a fallback
  if (!baseSlug) {
    baseSlug = `course-${Date.now()}`;
  }
  
  this.slug = baseSlug;
};

// Pre-save middleware to generate slug
CourseSchema.pre('save', async function(next) {
  // Only generate slug if it's a new document, title has changed, or slug is null/undefined
  if (this.isNew || this.isModified('title') || !this.slug) {
    // Generate base slug
    this.generateSlug();
    
    // Check for uniqueness and append number if needed
    const baseSlug = this.slug;
    let counter = 1;
    let isUnique = false;
    
    while (!isUnique) {
      try {
        const existingCourse = await this.constructor.findOne({ 
          slug: this.slug,
          _id: { $ne: this._id } // Exclude current document
        });
        
        if (!existingCourse) {
          isUnique = true;
        } else {
          this.slug = `${baseSlug}-${counter}`;
          counter++;
        }
      } catch (error) {
        return next(error);
      }
    }
  }
  
  next();
});

// Static method to fix existing null slugs
CourseSchema.statics.fixNullSlugs = async function() {
  try {
    console.log('🔧 Fixing courses with null slugs...');
    
    const coursesWithNullSlugs = await this.find({ 
      $or: [
        { slug: null }, 
        { slug: { $exists: false } },
        { slug: '' }
      ] 
    });
    
    console.log(`Found ${coursesWithNullSlugs.length} courses with null/missing slugs`);
    
    for (const course of coursesWithNullSlugs) {
      // Generate a unique slug for this course
      course.generateSlug();
      
      // Ensure uniqueness
      const baseSlug = course.slug;
      let counter = 1;
      let isUnique = false;
      
      while (!isUnique) {
        const existingCourse = await this.findOne({ 
          slug: course.slug,
          _id: { $ne: course._id }
        });
        
        if (!existingCourse) {
          isUnique = true;
        } else {
          course.slug = `${baseSlug}-${counter}`;
          counter++;
        }
      }
      
      await course.save();
      console.log(`✅ Fixed slug for course: "${course.title}" -> "${course.slug}"`);
    }
    
    console.log('🎉 Successfully fixed all null slugs');
    return { success: true, fixed: coursesWithNullSlugs.length };
  } catch (error) {
    console.error('❌ Error fixing null slugs:', error);
    return { success: false, error: error.message };
  }
};

// Pre-save middleware
CourseSchema.pre('save', function(next) {
  // Auto-set isPremium for paid courses
  if (this.courseType === 'paid') {
    this.isPremium = true;
  }
  
  // Calculate totals
  this.totalModules = this.modules.length;
  
  let totalSections = 0;
  let totalLessons = 0;
  let totalDurationSeconds = 0;
  
  this.modules.forEach(module => {
    // Count sections
    if (module.sections) {
      totalSections += module.sections.length;
      
      // Count lessons in sections and sum duration
      module.sections.forEach(section => {
        if (section.lessons) {
          totalLessons += section.lessons.length;
          section.lessons.forEach(lesson => {
            totalDurationSeconds += lesson.duration || 0;
          });
        }
      });
    }
    
    // Count direct lessons in module and sum duration
    if (module.lessons) {
      totalLessons += module.lessons.length;
      module.lessons.forEach(lesson => {
        totalDurationSeconds += lesson.duration || 0;
      });
    }
  });
  
  this.totalSections = totalSections;
  this.totalLessons = totalLessons;
  this.totalDuration = Math.ceil(totalDurationSeconds / 60); // Convert to minutes
  
  next();
});

// Static methods
CourseSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        published: {
          $sum: {
            $cond: [{ $eq: ['$isPublished', true] }, 1, 0]
          }
        },
        premium: {
          $sum: {
            $cond: [{ $eq: ['$isPremium', true] }, 1, 0]
          }
        },
        free: {
          $sum: {
            $cond: [{ $eq: ['$courseType', 'free'] }, 1, 0]
          }
        },
        paid: {
          $sum: {
            $cond: [{ $eq: ['$courseType', 'paid'] }, 1, 0]
          }
        },
        totalEnrollments: { $sum: '$enrollments' },
        totalCompletions: { $sum: '$completions' },
        avgRating: { $avg: '$rating' },
        totalRevenue: {
          $sum: {
            $multiply: ['$price', '$enrollments']
          }
        }
      }
    }
  ]);
};

CourseSchema.statics.getCategoryStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        published: {
          $sum: {
            $cond: [{ $eq: ['$isPublished', true] }, 1, 0]
          }
        },
        totalEnrollments: { $sum: '$enrollments' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

CourseSchema.statics.getSectionStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$section',
        count: { $sum: 1 },
        published: {
          $sum: {
            $cond: [{ $eq: ['$isPublished', true] }, 1, 0]
          }
        },
        totalEnrollments: { $sum: '$enrollments' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

CourseSchema.statics.findByProductId = function(productId) {
  return this.findOne({ productId });
};

CourseSchema.statics.getFeaturedCourses = function(limit = 10) {
  return this.find({
    isPublished: true,
    isFeatured: true
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

CourseSchema.statics.getPublishedCourses = function(options = {}) {
  const {
    category,
    section,
    level,
    courseType,
    limit = 20,
    page = 1,
    sort = { createdAt: -1 }
  } = options;
  
  const query = { isPublished: true };
  
  if (category) query.category = category;
  if (section) query.section = section;
  if (level) query.level = level;
  if (courseType) query.courseType = courseType;
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Instance methods
CourseSchema.methods.addModule = function(moduleData) {
  this.modules.push({
    ...moduleData,
    order: this.modules.length + 1,
    sections: [],
    lessons: []
  });
  return this.save();
};

CourseSchema.methods.addSectionToModule = function(moduleId, sectionData) {
  const module2 = this.modules.id(moduleId);
  if (!module2) throw new Error('Module not found');
  
  module2.sections.push({
    ...sectionData,
    order: module2.sections.length + 1,
    lessons: []
  });
  return this.save();
};

CourseSchema.methods.addLessonToModule = function(moduleId, lessonData) {
  const module2 = this.modules.id(moduleId);
  if (!module2) throw new Error('Module not found');
  
  module2.lessons.push({
    ...lessonData,
    order: module2.lessons.length + 1
  });
  return this.save();
};

CourseSchema.methods.addLessonToSection = function(moduleId, sectionId, lessonData) {
  const module2 = this.modules.id(moduleId);
  if (!module2) throw new Error('Module not found');
  
  const section = module2.sections.id(sectionId);
  if (!section) throw new Error('Section not found');
  
  section.lessons.push({
    ...lessonData,
    order: section.lessons.length + 1
  });
  return this.save();
};

CourseSchema.methods.removeModule = function(moduleId) {
  this.modules.id(moduleId).remove();
  
  // Reorder remaining modules
  this.modules.forEach((module, index) => {
    module.order = index + 1;
  });
  
  return this.save();
};

CourseSchema.methods.removeSection = function(moduleId, sectionId) {
  const module2 = this.modules.id(moduleId);
  if (!module2) throw new Error('Module not found');
  
  module2.sections.id(sectionId).remove();
  
  // Reorder remaining sections
  module2.sections.forEach((section, index) => {
    section.order = index + 1;
  });
  
  return this.save();
};

CourseSchema.methods.removeLesson = function(moduleId, sectionId, lessonId) {
  const module2 = this.modules.id(moduleId);
  if (!module2) throw new Error('Module not found');
  
  if (sectionId) {
    // Remove lesson from section
    const section = module2.sections.id(sectionId);
    if (!section) throw new Error('Section not found');
    
    section.lessons.id(lessonId).remove();
    
    // Reorder remaining lessons in section
    section.lessons.forEach((lesson, index) => {
      lesson.order = index + 1;
    });
  } else {
    // Remove lesson directly from module
    module.lessons.id(lessonId).remove();
    
    // Reorder remaining lessons in module
    module.lessons.forEach((lesson, index) => {
      lesson.order = index + 1;
    });
  }
  
  return this.save();
};

// Helper method to get all lessons in a course
CourseSchema.methods.getAllLessons = function() {
  const lessons = [];
  
  this.modules.forEach(module => {
    // Add direct lessons from module
    if (module.lessons) {
      module.lessons.forEach(lesson => {
        lessons.push({
          ...lesson.toObject(),
          moduleId: module._id,
          moduleName: module.title,
          sectionId: null,
          sectionName: null
        });
      });
    }
    
    // Add lessons from sections
    if (module.sections) {
      module.sections.forEach(section => {
        if (section.lessons) {
          section.lessons.forEach(lesson => {
            lessons.push({
              ...lesson.toObject(),
              moduleId: module._id,
              moduleName: module.title,
              sectionId: section._id,
              sectionName: section.title
            });
          });
        }
      });
    }
  });
  
  return lessons;
};

// Helper method to get course structure summary
CourseSchema.methods.getStructureSummary = function() {
  return {
    totalModules: this.totalModules,
    totalSections: this.totalSections,
    totalLessons: this.totalLessons,
    totalDuration: this.totalDuration,
    modules: this.modules.map(module => ({
      id: module._id,
      title: module.title,
      order: module.order,
      sectionsCount: module.sections ? module.sections.length : 0,
      directLessonsCount: module.lessons ? module.lessons.length : 0,
      sections: module.sections ? module.sections.map(section => ({
        id: section._id,
        title: section.title,
        order: section.order,
        lessonsCount: section.lessons ? section.lessons.length : 0
      })) : []
    }))
  };
};

export default mongoose.models.Course || mongoose.model('Course', CourseSchema);
