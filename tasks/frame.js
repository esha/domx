module.exports = function(grunt) {
    grunt.registerMultiTask('frame', 'Fill a "frame" file with other files', function() {
        var opts = this.options({
        	data: {
        		banner: grunt.config('banner'),
        		pkg: grunt.config('pkg')
        	}
        });

        this.files.forEach(function(group) {
        	var frame = grunt.file.read(group.frame || opts.frame);
        	opts.data.content = group.src.map(grunt.file.read).join('\n');

        	var result = grunt.template.process(frame, opts);
            grunt.file.write(group.dest, result);
            grunt.log.writeln('File `'+group.dest+'` created.');
        });
    });
};
